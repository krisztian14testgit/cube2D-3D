"""Adapter forwarding, picking, orbit button policy, and the frame timer."""

from __future__ import annotations

import asyncio
import contextlib
import math
from types import SimpleNamespace
from unittest.mock import create_autospec

import pytest
import pyvista as pv
from tests.fakes.renderers import FakeRaySource, FakeSceneRenderer

from grok_4_7.adapters.frame_timer import AsyncFrameTimer, _schedule
from grok_4_7.adapters.orbit_style import RightDragOrbitStyle, configure_interaction
from grok_4_7.adapters.pyvista_picker import PlotterRaySource, RayPicker, ray_from_display
from grok_4_7.adapters.pyvista_renderer import PyVistaCamera, PyVistaRenderer
from grok_4_7.math_types import ORIGIN, Vec3
from grok_4_7.orbit import clamp_orbit_radius
from grok_4_7.picking import Ray, intersect_sphere, intersect_xy_plane
from grok_4_7.ports import MeshDisplay, OrbitView, Transform


class RecordingPlotter:
    """Minimal plotter double that stores actors in a real dict."""

    def __init__(self) -> None:
        self.actors: dict[str, SimpleNamespace] = {}
        self.rendered = 0
        self.closed = False
        self.background: tuple[float, float, float] | None = None
        self.labels: list[str] = []
        self.camera = SimpleNamespace(parallel_scale=1.0, parallel_projection=False, clipping_range=(0.1, 1.0))
        self.camera_position: list[tuple[float, float, float]] | None = None
        self.iren: object | None = None
        self.parallel_enabled = False

    def add_mesh(self, mesh: object, **kwargs: object) -> None:
        del mesh
        name = str(kwargs["name"])
        self.actors[name] = SimpleNamespace(
            position=None,
            orientation=None,
            scale=None,
            prop=SimpleNamespace(color=None),
        )

    def remove_actor(self, name: str) -> None:
        self.actors.pop(name, None)

    def clear_actors(self) -> None:
        self.actors.clear()

    def render(self) -> None:
        self.rendered += 1

    def close(self) -> None:
        self.closed = True

    def set_background(self, color: tuple[float, float, float]) -> None:
        self.background = color

    def add_point_labels(self, points: object, labels: list[str], **kwargs: object) -> None:
        del points, kwargs
        self.labels.extend(labels)

    def enable_parallel_projection(self) -> None:
        self.parallel_enabled = True

    def disable_parallel_projection(self) -> None:
        self.camera.parallel_projection = False


@pytest.mark.parametrize("make", [FakeSceneRenderer, lambda: PyVistaRenderer(RecordingPlotter())])  # type: ignore[arg-type]
def test_renderer_contract__add_then_remove__name_is_absent(make: object) -> None:
    renderer = make()  # type: ignore[operator]
    renderer.add_mesh(pv.Cube(), MeshDisplay("ball", "#ffffff"))
    assert renderer.contains("ball") is True
    renderer.remove("ball")
    assert renderer.contains("ball") is False


def test_pyvista_renderer__transform__converts_radians_to_degrees() -> None:
    plotter = RecordingPlotter()
    renderer = PyVistaRenderer(plotter)  # type: ignore[arg-type]
    renderer.add_mesh(pv.Cube(), MeshDisplay("cube", "#87cefa"))
    renderer.set_transform("cube", Transform(Vec3(1, 2, 3), Vec3(0, math.pi, 0), 2))
    actor = plotter.actors["cube"]
    assert actor.position == (1, 2, 3)
    assert actor.orientation[1] == pytest.approx(180)
    assert actor.scale == (2, 2, 2)
    renderer.set_color("cube", "#ff00aa")
    assert actor.prop.color == "#ff00aa"
    renderer.set_transform("missing", Transform(ORIGIN, ORIGIN, 1))
    renderer.close()
    renderer.close()
    assert plotter.closed is True


def test_pyvista_renderer__autospec_plotter__forwards_add_mesh() -> None:
    plotter = create_autospec(pv.Plotter, instance=True)
    plotter.actors = {}
    renderer = PyVistaRenderer(plotter)
    renderer.add_mesh(pv.Cube(), MeshDisplay("cube", "#ffffff", style="wireframe", opacity=0.15, pickable=True))
    plotter.add_mesh.assert_called_once()
    renderer.refresh()
    plotter.render.assert_called_once()
    renderer.clear()
    plotter.clear_actors.assert_called_once()


def test_pyvista_camera__orbit__stores_limits_and_speed() -> None:
    plotter = RecordingPlotter()
    style = SimpleNamespace(MotionFactor=0.0)
    plotter.iren = SimpleNamespace(style=style)
    camera = PyVistaCamera(plotter)  # type: ignore[arg-type]
    camera.show_orbit(OrbitView(math.pi / 4, math.pi / 3, 12, ORIGIN, 4, 40))
    camera.set_orbit_speed(2)
    assert camera.lower_radius == pytest.approx(4)
    assert camera.upper_radius == pytest.approx(40)
    assert style.MotionFactor == pytest.approx(2)
    assert plotter.camera_position is not None
    assert plotter.camera.parallel_projection is False


def test_ray_picker__plane_and_sphere__use_injected_ray() -> None:
    source = FakeRaySource(Ray(Vec3(0, 0, 10), Vec3(0, 0, -1)))
    picker = RayPicker(source, lambda: 5)
    assert picker.pick_xy_plane(1, 2) == Vec3(0, 0, 0)
    assert picker.pick_sphere(1, 2) == pytest.approx(Vec3(0, 0, 5))
    assert intersect_xy_plane(Ray(ORIGIN, Vec3(1, 0, 0))) is None
    assert intersect_sphere(Ray(ORIGIN, Vec3(1, 0, 0)), 0) is None


def test_ray_from_display__homogeneous_points__builds_a_normalized_ray() -> None:
    class _Renderer:
        def __init__(self) -> None:
            self.depth = 0.0

        def SetDisplayPoint(self, _x: float, _y: float, depth: float) -> None:
            self.depth = depth

        def DisplayToWorld(self) -> None:
            return None

        def GetWorldPoint(self) -> tuple[float, float, float, float]:
            if self.depth == 0:
                return (0.0, 0.0, 10.0, 1.0)
            return (0.0, 0.0, 0.0, 1.0)

    ray = ray_from_display(_Renderer(), 4, 5)
    assert ray is not None
    assert ray.origin.z == pytest.approx(10)
    assert ray.direction.z == pytest.approx(-1)
    assert PlotterRaySource(SimpleNamespace(renderer=None)).ray_through_pixel(0, 0) is None


def test_clamp_orbit_radius__outside_and_inside__keeps_the_ray() -> None:
    far = clamp_orbit_radius(Vec3(0, 0, 100), ORIGIN, 4, 40)
    near = clamp_orbit_radius(Vec3(0, 0, 1), ORIGIN, 4, 40)
    inside = clamp_orbit_radius(Vec3(0, 0, 12), ORIGIN, 4, 40)
    collapsed = clamp_orbit_radius(Vec3(1, 2, 3), Vec3(1, 2, 3), 4, 40)
    assert far == Vec3(0, 0, 40)
    assert near == Vec3(0, 0, 4)
    assert inside == Vec3(0, 0, 12)
    assert collapsed == Vec3(1, 2, 7)


def test_pyvista_camera__radius_limits__clamps_position_and_notifies_style() -> None:
    pushed: list[tuple[float, float]] = []
    style = SimpleNamespace(MotionFactor=1.0, set_radius_limits=lambda lower, upper: pushed.append((lower, upper)))
    plotter = RecordingPlotter()
    plotter.iren = SimpleNamespace(style=style)
    plotter.camera.position = (0.0, 0.0, 80.0)
    plotter.camera.focal_point = (0.0, 0.0, 0.0)
    camera = PyVistaCamera(plotter)  # type: ignore[arg-type]
    camera.set_radius_limits(4, 40)
    assert plotter.camera.position == pytest.approx((0.0, 0.0, 40.0))
    assert pushed == [(4.0, 40.0)]


def test_orbit_style__radius_limits__without_renderer_do_not_raise() -> None:
    style = RightDragOrbitStyle()
    style.set_radius_limits(4, 48)
    assert style._lower_radius == pytest.approx(4)  # noqa: SLF001
    assert style._upper_radius == pytest.approx(48)  # noqa: SLF001


def test_configure_interaction__missing_interactor__does_not_raise() -> None:
    configure_interaction(SimpleNamespace(iren=None), lambda _x, _y: None, orbit=True)


def test_configure_interaction__fake_interactor__binds_left_click_and_orbit() -> None:
    clicks: list[tuple[float, float]] = []

    class _Iren:
        def __init__(self) -> None:
            self.style = None
            self.observers: dict[str, object] = {}

        def SetInteractorStyle(self, style: object) -> None:
            self.style = style

        def AddObserver(self, event: str, callback: object) -> str:
            self.observers[event] = callback
            return event

        def GetEventPosition(self) -> tuple[float, float]:
            return (12.0, 34.0)

    iren = _Iren()
    configure_interaction(SimpleNamespace(iren=iren), lambda x, y: clicks.append((x, y)), orbit=True)
    assert isinstance(iren.style, RightDragOrbitStyle)
    iren.style.OnLeftButtonDown()
    assert iren.style.is_rotating is False
    iren.observers["LeftButtonPressEvent"](iren, "LeftButtonPressEvent")  # type: ignore[operator]
    assert clicks == [(12.0, 34.0)]


def test_schedule__unscheduled_task__closes_pending() -> None:
    closed: list[str] = []

    class _Pending:
        def close(self) -> None:
            closed.append("closed")
            raise RuntimeError("already closed")

    assert _schedule(lambda _work: None, _Pending()) is None
    assert closed == ["closed"]


def test_async_frame_timer__no_running_loop__defers_until_activate() -> None:
    timer = AsyncFrameTimer(lambda: 0.0, asyncio.sleep, asyncio.create_task)
    timer.start(lambda _delta: None)
    assert timer.is_running is True
    assert timer.task is None

    async def _activate() -> None:
        timer.activate()
        task = timer.task
        assert isinstance(task, asyncio.Task)
        timer.stop()
        with contextlib.suppress(asyncio.CancelledError):
            await task

    asyncio.run(_activate())
    assert timer.task is None


def test_async_frame_timer__stop__cancels_the_started_task() -> None:
    cancelled: list[object] = []

    class _Task:
        def cancel(self) -> None:
            cancelled.append(self)

    def _create_task(work: object) -> _Task:
        close = getattr(work, "close", None)
        if callable(close):
            close()
        return _Task()

    timer = AsyncFrameTimer(lambda: 0.0, asyncio.sleep, _create_task)
    timer.start(lambda _delta: None)
    assert timer.is_running is True
    handle = timer.task
    timer.stop()
    timer.stop()
    assert timer.is_running is False
    assert cancelled == [handle]


def test_async_frame_timer__loop__emits_elapsed_seconds() -> None:
    times = iter((0.0, 0.03))
    deltas: list[float] = []

    async def _sleep(_seconds: float) -> None:
        return None

    timer = AsyncFrameTimer(lambda: next(times), _sleep, lambda work: work)

    def _record(delta: float) -> None:
        deltas.append(delta)
        timer._running = False  # noqa: SLF001

    timer._running = True  # noqa: SLF001
    timer._on_tick = _record  # noqa: SLF001
    asyncio.run(timer._loop())  # noqa: SLF001
    assert deltas == [pytest.approx(0.03)]
