"""Composition root. Concretes are created here, not inside feature scenes."""

from __future__ import annotations

import asyncio
import logging
import random
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol, cast

import pyvista as pv
from trame.app import get_server
from trame.ui.vuetify3 import SinglePageLayout
from trame.widgets import vuetify3
from trame_pyvista.ui import plotter_ui

from grok_4_7.adapters.frame_timer import AsyncFrameTimer
from grok_4_7.adapters.orbit_style import configure_interaction
from grok_4_7.adapters.pyvista_picker import PlotterRaySource, RayPicker
from grok_4_7.adapters.pyvista_renderer import PyVistaCamera, PyVistaRenderer
from grok_4_7.errors import InvalidAxisError, InvalidColorError
from grok_4_7.features.bouncing_squares.constants import DEFAULT_MAX_SQUARES, DEFAULT_SPEED
from grok_4_7.features.bouncing_squares.math import format_square_status
from grok_4_7.features.coordinate_system.constants import DEFAULT_SCALE
from grok_4_7.features.cube_3d.constants import (
    DEFAULT_COLOR,
    DEFAULT_ROTATION_SPEED,
    STATUS_CLICK,
)
from grok_4_7.features.cubes_exploding.constants import (
    DEFAULT_CAMERA_ROTATION_SPEED,
    DEFAULT_MAX_CUBES,
    DEFAULT_SPHERE_SCALE,
)
from grok_4_7.features.cubes_exploding.math import format_cube_status
from grok_4_7.numbers import is_finite_number
from grok_4_7.pages.copy import (
    DEFAULT_PORT,
    LABEL_COORD,
    LABEL_CUBES,
    PAGE_COORD,
    PAGE_CUBES,
    TOOLBAR_TITLE,
)
from grok_4_7.pages.host import PageDependencies, PageHost
from grok_4_7.ports import FrameTimer

logger = logging.getLogger(__name__)


class _Server(Protocol):
    """Narrow view of the trame server used by the composition root."""

    state: object
    controller: object


@dataclass(frozen=True, slots=True)
class AppOverrides:
    """Optional replacements for tests. ``None`` means use the real adapter."""

    server_name: str = "grok-4-7"
    rng: random.Random | None = None
    clock: Callable[[], float] | None = None
    plotter_factory: Callable[[], object] | None = None
    timer_factory: Callable[[], FrameTimer] | None = None
    view_factory: Callable[[object], object] | None = None
    renderer_factory: Callable[[object], object] | None = None
    camera_factory: Callable[[object], object] | None = None
    picker_factory: Callable[[object, Callable[[], float]], object] | None = None


def build_app(server: object | None = None, overrides: AppOverrides | None = None) -> object:
    """Build the trame server without starting it.

    The active page is ``coord_2d``. Switching pages disposes the previous
    plotters and timer before building fresh scenes.
    """
    settings = overrides or AppOverrides()
    resolved = server if server is not None else get_server(settings.server_name, client_type="vue3")
    app_server = cast(_Server, resolved)
    _seed_state(app_server.state)
    host = _make_host(app_server, settings)
    _wire_handlers(app_server, host)
    with SinglePageLayout(app_server) as layout:
        layout.title.set_text(TOOLBAR_TITLE)
        _add_toolbar(layout, app_server, host)
        _attach(app_server, host, layout)
    host.show(PAGE_COORD)
    _flush_layout(app_server)
    _activate_timer_on_ready(app_server, host)
    return app_server


def main() -> None:
    """Start the playground on port 8080."""
    logging.basicConfig(level=logging.INFO)
    server = build_app()
    server.start(port=DEFAULT_PORT)  # type: ignore[attr-defined]


def _seed_state(state: object) -> None:
    state.page = PAGE_COORD  # type: ignore[attr-defined]
    state.coord_scale = DEFAULT_SCALE  # type: ignore[attr-defined]
    state.max_squares = DEFAULT_MAX_SQUARES  # type: ignore[attr-defined]
    state.square_speed = DEFAULT_SPEED  # type: ignore[attr-defined]
    state.square_status = format_square_status(0, DEFAULT_MAX_SQUARES)  # type: ignore[attr-defined]
    state.rotation_axis = "y"  # type: ignore[attr-defined]
    state.rotation_speed = DEFAULT_ROTATION_SPEED  # type: ignore[attr-defined]
    state.cube_scale = DEFAULT_SCALE  # type: ignore[attr-defined]
    state.cube_color = DEFAULT_COLOR  # type: ignore[attr-defined]
    state.cube_exists = False  # type: ignore[attr-defined]
    state.cube_status = STATUS_CLICK  # type: ignore[attr-defined]
    state.sphere_scale = DEFAULT_SPHERE_SCALE  # type: ignore[attr-defined]
    state.max_cubes = DEFAULT_MAX_CUBES  # type: ignore[attr-defined]
    state.camera_speed = DEFAULT_CAMERA_ROTATION_SPEED  # type: ignore[attr-defined]
    state.exploding_status = format_cube_status(0, DEFAULT_MAX_CUBES)  # type: ignore[attr-defined]


def _add_toolbar(layout: object, server: object, host: PageHost) -> None:
    with layout.toolbar:  # type: ignore[attr-defined]
        vuetify3.VBtn(LABEL_COORD, click=lambda: _show_page(server, host, PAGE_COORD), variant="text")
        vuetify3.VBtn(LABEL_CUBES, click=lambda: _show_page(server, host, PAGE_CUBES), variant="text")


def _show_page(server: object, host: PageHost, page: str) -> None:
    server.state.page = page  # type: ignore[attr-defined]
    host.show(page)
    _flush_layout(server)
    _sync_status(server, host)
    host.refresh_views()


def _flush_layout(server: object) -> None:
    """Push the rebuilt page template to the browser."""
    layout = getattr(server, "grok_layout", None)
    if layout is not None:
        layout.flush_content()
    host = getattr(server, "grok_host", None)
    if host is not None:
        _apply_square_controls(server, host)


def _apply_square_controls(server: object, host: PageHost) -> None:
    """Make a freshly built bouncing scene match the slider values kept in state."""
    state = server.state  # type: ignore[attr-defined]
    _set_square_speed(host, state.square_speed)
    _set_max_squares(server, host, state.max_squares)


def _wire_handlers(server: object, host: PageHost) -> None:
    state = server.state  # type: ignore[attr-defined]
    state.change("page")(_on_page(server, host))
    state.change("coord_scale")(_on_coord_scale(host))
    state.change("max_squares")(_on_max_squares(server, host))
    state.change("square_speed")(_on_square_speed(host))
    state.change("rotation_axis")(_on_axis(host))
    state.change("rotation_speed")(_on_speed(host))
    state.change("cube_scale")(_on_cube_scale(host))
    state.change("cube_color")(_on_color(host))
    state.change("sphere_scale")(_on_sphere(host))
    state.change("max_cubes")(_on_max_cubes(server, host))
    state.change("camera_speed")(_on_camera(host))
    host.after_mutation = lambda: _after_click(server, host)
    host.on_frame = lambda: _sync_status(server, host)
    controller = server.controller  # type: ignore[attr-defined]
    controller.add("show_coord")(lambda: _show_page(server, host, PAGE_COORD))
    controller.add("show_cubes")(lambda: _show_page(server, host, PAGE_CUBES))
    controller.add("create_cube")(host.create_cube)
    controller.add("spawn_square")(host.spawn_square)
    controller.add("spawn_exploding")(host.spawn_exploding)


def _on_page(server: object, host: PageHost) -> Callable[..., None]:
    def _handle(page: str, **_kwargs: object) -> None:
        host.show(str(page))
        _flush_layout(server)
        _sync_status(server, host)
        host.refresh_views()

    return _handle


def _on_coord_scale(host: PageHost) -> Callable[..., None]:
    def _handle(coord_scale: object, **_kwargs: object) -> None:
        _scale_square(host, coord_scale)

    return _handle


def _on_square_speed(host: PageHost) -> Callable[..., None]:
    def _handle(square_speed: object, **_kwargs: object) -> None:
        _set_square_speed(host, square_speed)

    return _handle


def _on_max_squares(server: object, host: PageHost) -> Callable[..., None]:
    def _handle(max_squares: object, **_kwargs: object) -> None:
        _set_max_squares(server, host, max_squares)

    return _handle


def _on_axis(host: PageHost) -> Callable[..., None]:
    def _handle(rotation_axis: object, **_kwargs: object) -> None:
        _set_axis(host, rotation_axis)

    return _handle


def _on_speed(host: PageHost) -> Callable[..., None]:
    def _handle(rotation_speed: object, **_kwargs: object) -> None:
        _set_speed(host, rotation_speed)

    return _handle


def _on_cube_scale(host: PageHost) -> Callable[..., None]:
    def _handle(cube_scale: object, **_kwargs: object) -> None:
        _set_cube_scale(host, cube_scale)

    return _handle


def _on_color(host: PageHost) -> Callable[..., None]:
    def _handle(cube_color: object, **_kwargs: object) -> None:
        _set_color(host, cube_color)

    return _handle


def _on_sphere(host: PageHost) -> Callable[..., None]:
    def _handle(sphere_scale: object, **_kwargs: object) -> None:
        _set_sphere(host, sphere_scale)

    return _handle


def _on_max_cubes(server: object, host: PageHost) -> Callable[..., None]:
    def _handle(max_cubes: object, **_kwargs: object) -> None:
        _set_max_cubes(server, host, max_cubes)

    return _handle


def _on_camera(host: PageHost) -> Callable[..., None]:
    def _handle(camera_speed: object, **_kwargs: object) -> None:
        _set_camera_speed(host, camera_speed)

    return _handle


def _make_host(server: object, settings: AppOverrides) -> PageHost:
    rng = settings.rng or random.Random()
    layout_box: dict[str, object] = {}

    def mount_context() -> object:
        return layout_box["content"]

    def content_clear() -> None:
        content = layout_box.get("content")
        if content is not None:
            content.clear()  # type: ignore[attr-defined]

    dependencies = PageDependencies(
        rng_factory=lambda: rng,
        plotter_factory=settings.plotter_factory or _plotter,
        timer_factory=settings.timer_factory or (lambda: _timer(settings)),
        view_factory=settings.view_factory or (lambda plotter: _view(plotter, server)),
        renderer_factory=settings.renderer_factory or _renderer,  # type: ignore[arg-type]
        camera_factory=settings.camera_factory or _camera,  # type: ignore[arg-type]
        picker_factory=settings.picker_factory or _picker,  # type: ignore[arg-type]
        bind_click=lambda plotter, handler: configure_interaction(plotter, handler, orbit=False),
        bind_orbit_click=lambda plotter, handler: configure_interaction(plotter, handler, orbit=True),
        content_clear=content_clear,
        mount_context=mount_context,  # type: ignore[arg-type]
    )
    host = PageHost(dependencies)
    layout_box["host"] = host
    server.grok_layout_box = layout_box  # type: ignore[attr-defined]
    return host


def _attach(server: object, host: PageHost, layout: object) -> None:
    box = server.grok_layout_box  # type: ignore[attr-defined]
    box["content"] = layout.content  # type: ignore[attr-defined]
    box["layout"] = layout
    server.grok_host = host  # type: ignore[attr-defined]
    server.grok_layout = layout  # type: ignore[attr-defined]


def _activate_timer_on_ready(server: object, host: PageHost) -> None:
    def _ready(**_kwargs: object) -> None:
        timer = host.timer
        if timer is not None and hasattr(timer, "activate"):
            timer.activate()

    server.controller.on_server_ready.add(_ready)  # type: ignore[attr-defined]


def _after_click(server: object, host: PageHost) -> None:
    _apply_cube_controls(server, host)
    _sync_status(server, host)
    host.refresh_views()


def _apply_cube_controls(server: object, host: PageHost) -> None:
    scene = host.cube_scene
    if scene is None or not scene.has_cube:
        return
    state = server.state  # type: ignore[attr-defined]
    scene.set_rotation_axis(str(state.rotation_axis))
    scene.set_rotation_speed(_as_float(state.rotation_speed))
    scene.set_cube_scale(_as_float(state.cube_scale))
    scene.set_cube_color(str(state.cube_color))


def _scale_square(host: PageHost, value: object) -> None:
    scene = host.coordinate_scene
    if scene is None:
        return
    try:
        scene.set_square_scale(_as_float(value))
    except ValueError:
        logger.debug("ignored square scale %s", value)
        return
    host.refresh_views()


def _set_square_speed(host: PageHost, value: object) -> None:
    scene = host.bouncing_scene
    if scene is None:
        return
    scene.set_speed(_as_float(value))


def _set_max_squares(server: object, host: PageHost, value: object) -> None:
    scene = host.bouncing_scene
    if scene is None:
        return
    scene.set_max_squares(_as_float(value))
    _sync_status(server, host)
    host.refresh_views()


def _set_axis(host: PageHost, value: object) -> None:
    scene = host.cube_scene
    if scene is None:
        return
    try:
        scene.set_rotation_axis(str(value))
    except InvalidAxisError:
        logger.debug("ignored rotation axis %s", value)


def _set_speed(host: PageHost, value: object) -> None:
    scene = host.cube_scene
    if scene is None:
        return
    try:
        scene.set_rotation_speed(_as_float(value))
    except ValueError:
        logger.debug("ignored rotation speed %s", value)


def _set_cube_scale(host: PageHost, value: object) -> None:
    scene = host.cube_scene
    if scene is None:
        return
    try:
        changed = scene.set_cube_scale(_as_float(value))
    except ValueError:
        logger.debug("ignored cube scale %s", value)
        return
    if changed:
        host.refresh_views()


def _set_color(host: PageHost, value: object) -> None:
    scene = host.cube_scene
    if scene is None:
        return
    try:
        scene.set_cube_color(str(value))
    except InvalidColorError:
        logger.debug("ignored cube color %s", value)
        return
    host.refresh_views()


def _set_sphere(host: PageHost, value: object) -> None:
    scene = host.exploding_scene
    if scene is not None:
        scene.set_sphere_scale(_as_float(value))
        host.refresh_views()


def _set_max_cubes(server: object, host: PageHost, value: object) -> None:
    scene = host.exploding_scene
    if scene is None:
        return
    scene.set_max_cubes(_as_float(value))
    _sync_status(server, host)


def _set_camera_speed(host: PageHost, value: object) -> None:
    scene = host.exploding_scene
    if scene is not None:
        scene.set_camera_rotation_speed(_as_float(value))


def _sync_status(server: object, host: PageHost) -> None:
    state = server.state  # type: ignore[attr-defined]
    if host.bouncing_scene is not None:
        state.square_status = host.bouncing_scene.status_text
    if host.cube_scene is not None:
        state.cube_exists = host.cube_scene.has_cube
        state.cube_status = host.cube_scene.status_text
    if host.exploding_scene is not None:
        state.exploding_status = host.exploding_scene.status_text
    state.flush()


def _as_float(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float | str):
        return float("nan")
    try:
        parsed = float(value)
    except ValueError:
        return float("nan")
    if not is_finite_number(parsed):
        return float("nan")
    return parsed


def _plotter() -> pv.Plotter:
    return pv.Plotter(off_screen=True)


def _renderer(plotter: object) -> PyVistaRenderer:
    return PyVistaRenderer(plotter)  # type: ignore[arg-type]


def _camera(plotter: object) -> PyVistaCamera:
    return PyVistaCamera(plotter)  # type: ignore[arg-type]


def _picker(plotter: object, radius_of: Callable[[], float]) -> RayPicker:
    return RayPicker(PlotterRaySource(plotter), radius_of)


def _view(plotter: object, server: object | None = None) -> object:
    return plotter_ui(  # type: ignore[no-untyped-call]
        plotter,
        mode="server",
        add_menu=False,
        default_server_rendering=True,
        server=server,
    )


def _timer(settings: AppOverrides) -> AsyncFrameTimer:
    clock = settings.clock or time.perf_counter
    return AsyncFrameTimer(clock, asyncio.sleep, _create_task)


def _create_task(work: object) -> object:
    return asyncio.create_task(work)  # type: ignore[arg-type]
