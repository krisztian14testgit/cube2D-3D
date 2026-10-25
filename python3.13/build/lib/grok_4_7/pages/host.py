"""Active-page owner. Only the visible page keeps plotters and a timer."""

from __future__ import annotations

import logging
import random
from collections.abc import Callable
from dataclasses import dataclass
from types import TracebackType
from typing import Protocol

from grok_4_7.features.bouncing_squares.scene import BouncingServices, BouncingSquaresScene
from grok_4_7.features.coordinate_system.scene import CoordinateScene
from grok_4_7.features.cube_3d.scene import CubeScene
from grok_4_7.features.cubes_exploding.effects import BurstBook
from grok_4_7.features.cubes_exploding.scene import ExplodingScene, ExplodingServices
from grok_4_7.frame_time import clamp_frame_delta
from grok_4_7.lifecycle import TickRegistry
from grok_4_7.pages.copy import PAGE_COORD, PAGE_CUBES
from grok_4_7.pages.mount import mount_coord_page, mount_cubes_page
from grok_4_7.ports import (
    CameraController,
    ExplosionEffect,
    FrameTimer,
    SceneRenderer,
    ViewPicker,
)

logger = logging.getLogger(__name__)


class UiContext(Protocol):
    """Layout content that can be entered as a context manager."""

    def __enter__(self) -> object: ...

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None: ...


ClickHandler = Callable[[float, float], None]
Binder = Callable[[object, ClickHandler], None]


@dataclass(frozen=True, slots=True)
class PageDependencies:
    """Factories used when a page is entered. Tests replace these with fakes."""

    rng_factory: Callable[[], random.Random]
    plotter_factory: Callable[[], object]
    timer_factory: Callable[[], FrameTimer]
    view_factory: Callable[[object], object]
    renderer_factory: Callable[[object], SceneRenderer]
    camera_factory: Callable[[object], CameraController]
    picker_factory: Callable[[object, Callable[[], float]], ViewPicker]
    bind_click: Binder
    bind_orbit_click: Binder
    content_clear: Callable[[], None]
    mount_context: Callable[[], UiContext]


class PageHost:
    """Builds, shows, and disposes one page at a time."""

    def __init__(self, dependencies: PageDependencies) -> None:
        self._dependencies = dependencies
        self._active: str | None = None
        self._timer: FrameTimer | None = None
        self._registry: TickRegistry | None = None
        self._closers: list[Callable[[], None]] = []
        self._view_updates: list[Callable[[], None]] = []
        self.coordinate_scene: CoordinateScene | None = None
        self.bouncing_scene: BouncingSquaresScene | None = None
        self.cube_scene: CubeScene | None = None
        self.exploding_scene: ExplodingScene | None = None
        self.bouncing_picker: ViewPicker | None = None
        self.after_mutation: Callable[[], None] | None = None
        self.on_frame: Callable[[], None] | None = None
        self._disposed_coordinate: CoordinateScene | None = None
        self._disposed_bouncing: BouncingSquaresScene | None = None
        self._disposed_cube: CubeScene | None = None
        self._disposed_exploding: ExplodingScene | None = None

    @property
    def active_page(self) -> str | None:
        """Page id that currently owns plotters, or ``None`` after leave."""
        return self._active

    @property
    def timer(self) -> FrameTimer | None:
        """Running timer, if a page is active."""
        return self._timer

    def show(self, page: str) -> None:
        """Leave the current page and build ``page``. Unknown ids only leave."""
        if page == self._active:
            return
        self.leave()
        if page == PAGE_COORD:
            self._enter_coord()
            return
        if page == PAGE_CUBES:
            self._enter_cubes()
            return
        logger.warning("unknown page %s", page)

    def leave(self) -> None:
        """Dispose both scenes, stop the timer, and close plotters. Safe twice."""
        self._stop_timer()
        self._dispose_scenes()
        self._close_plotters()
        self._active = None
        self._registry = None
        self._view_updates.clear()
        self._dependencies.content_clear()

    def refresh_views(self) -> None:
        """Push the latest render to each mounted trame view."""
        for update in self._view_updates:
            update()

    def create_cube(self) -> None:
        """Create the single cube from a click or a controller call."""
        self._create_click(0.0, 0.0)

    def spawn_square(self, x_px: float, y_px: float) -> None:
        """Pick the XY plane and spawn a bouncing square."""
        self._spawn_click(x_px, y_px)

    def spawn_exploding(self, x_px: float, y_px: float) -> None:
        """Pick the sphere and spawn an exploding cube."""
        self._explode_click(x_px, y_px)

    def _enter_coord(self) -> None:
        top_plotter, bottom_plotter = self._open_pair()
        registry = TickRegistry()
        self.coordinate_scene = CoordinateScene(*self._ports(top_plotter))
        self.bouncing_scene = self._bouncing(bottom_plotter, registry)
        self.bouncing_picker = self._dependencies.picker_factory(bottom_plotter, lambda: 0.0)
        self._dependencies.bind_click(bottom_plotter, self._spawn_click)
        self._mount(top_plotter, bottom_plotter, mount_coord_page)
        self._start(registry, self.coordinate_scene, self.bouncing_scene, PAGE_COORD)

    def _enter_cubes(self) -> None:
        top_plotter, bottom_plotter = self._open_pair()
        registry = TickRegistry()
        self.cube_scene = CubeScene(*self._ports(top_plotter), registry)
        self.exploding_scene = self._exploding(bottom_plotter, registry)
        self._dependencies.bind_orbit_click(top_plotter, self._create_click)
        self._dependencies.bind_orbit_click(bottom_plotter, self._explode_click)
        self._mount(top_plotter, bottom_plotter, mount_cubes_page)
        self._start(registry, self.cube_scene, self.exploding_scene, PAGE_CUBES)

    def _start(
        self,
        registry: TickRegistry,
        top: CoordinateScene | BouncingSquaresScene | CubeScene | ExplodingScene,
        bottom: CoordinateScene | BouncingSquaresScene | CubeScene | ExplodingScene,
        page: str,
    ) -> None:
        top.build()
        bottom.build()
        self._registry = registry
        self._timer = self._dependencies.timer_factory()
        self._timer.start(self._on_tick)
        self._active = page

    def _on_tick(self, delta_seconds: float) -> None:
        if self._registry is not None:
            self._registry.fire(clamp_frame_delta(delta_seconds))
        if self.on_frame is not None:
            self.on_frame()
        self.refresh_views()

    def _open_pair(self) -> tuple[object, object]:
        return self._dependencies.plotter_factory(), self._dependencies.plotter_factory()

    def _ports(self, plotter: object) -> tuple[SceneRenderer, CameraController]:
        renderer = self._dependencies.renderer_factory(plotter)
        self._closers.append(renderer.close)
        return renderer, self._dependencies.camera_factory(plotter)

    def _bouncing(self, plotter: object, registry: TickRegistry) -> BouncingSquaresScene:
        renderer, camera = self._ports(plotter)
        return BouncingSquaresScene(BouncingServices(renderer, camera, self._rng(), registry))

    def _exploding(self, plotter: object, registry: TickRegistry) -> ExplodingScene:
        renderer, camera = self._ports(plotter)
        picker = self._dependencies.picker_factory(plotter, self._sphere_radius)
        services = ExplodingServices(renderer, camera, picker, self._effects(), registry, self._rng())
        return ExplodingScene(services)

    def _mount(
        self,
        top: object,
        bottom: object,
        mount: Callable[..., None],
    ) -> None:
        with self._dependencies.mount_context():
            mount(top, bottom, self._track_view)

    def _track_view(self, plotter: object) -> object:
        view = self._dependencies.view_factory(plotter)
        update = getattr(view, "update", None)
        if callable(update):
            self._view_updates.append(update)
        return view

    def _spawn_click(self, x_px: float, y_px: float) -> None:
        scene = self.bouncing_scene
        picker = self.bouncing_picker
        if scene is None or picker is None:
            self._notify()
            return
        point = picker.pick_xy_plane(x_px, y_px)
        if point is not None:
            scene.spawn_at(point)
        self._notify()

    def _create_click(self, _x_px: float, _y_px: float) -> None:
        if self.cube_scene is not None:
            self.cube_scene.create_cube_if_missing()
        self._notify()

    def _explode_click(self, x_px: float, y_px: float) -> None:
        if self.exploding_scene is not None:
            self.exploding_scene.try_spawn_at_screen(x_px, y_px)
        self._notify()

    def _notify(self) -> None:
        if self.after_mutation is not None:
            self.after_mutation()

    def _sphere_radius(self) -> float:
        if self.exploding_scene is None:
            return 8.0
        return self.exploding_scene.sphere_scale

    def _rng(self) -> random.Random:
        return self._dependencies.rng_factory()

    def _effects(self) -> ExplosionEffect:
        return BurstBook(self._rng())

    def _stop_timer(self) -> None:
        if self._timer is not None:
            self._timer.stop()
            self._timer = None

    def _dispose_scenes(self) -> None:
        self._disposed_coordinate = self.coordinate_scene
        self._disposed_bouncing = self.bouncing_scene
        self._disposed_cube = self.cube_scene
        self._disposed_exploding = self.exploding_scene
        for scene in (
            self.coordinate_scene,
            self.bouncing_scene,
            self.cube_scene,
            self.exploding_scene,
        ):
            if scene is not None:
                scene.dispose()
        self.coordinate_scene = None
        self.bouncing_scene = None
        self.cube_scene = None
        self.exploding_scene = None
        self.bouncing_picker = None

    def _close_plotters(self) -> None:
        for close in self._closers:
            close()
        self._closers.clear()
