"""Fakes that record scene output. Prefer these over mocks for state assertions."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field

import pyvista as pv

from grok_4_7.math_types import Vec3
from grok_4_7.picking import Ray
from grok_4_7.ports import MeshDisplay, OrbitView, OrthographicView, Transform


@dataclass
class MeshRecord:
    """One mesh as the fake renderer remembers it."""

    display: MeshDisplay
    transform: Transform | None = None
    color: str = ""


@dataclass
class FakeSceneRenderer:
    """In-memory renderer used by scene tests and as the port's contract partner."""

    meshes: dict[str, MeshRecord] = field(default_factory=dict)
    labels: dict[str, tuple[str, Vec3]] = field(default_factory=dict)
    background: tuple[float, float, float] | None = None
    refresh_count: int = 0
    close_count: int = 0
    cleared: bool = False

    def add_mesh(self, mesh: pv.PolyData, display: MeshDisplay) -> None:
        self.meshes[display.name] = MeshRecord(display, color=display.color)
        del mesh

    def remove(self, name: str) -> None:
        self.meshes.pop(name, None)

    def clear(self) -> None:
        self.meshes.clear()
        self.labels.clear()
        self.cleared = True

    def set_transform(self, name: str, transform: Transform) -> None:
        record = self.meshes.get(name)
        if record is not None:
            record.transform = transform

    def set_color(self, name: str, color: str) -> None:
        record = self.meshes.get(name)
        if record is not None:
            record.color = color

    def set_background(self, color: tuple[float, float, float]) -> None:
        self.background = color

    def add_label(self, text: str, position: Vec3, *, name: str) -> None:
        self.labels[name] = (text, position)

    def refresh(self) -> None:
        self.refresh_count += 1

    def contains(self, name: str) -> bool:
        return name in self.meshes or name in self.labels

    def close(self) -> None:
        self.close_count += 1


@dataclass
class FakeCamera:
    """Records camera commands."""

    orthographic: OrthographicView | None = None
    orbit: OrbitView | None = None
    lower_radius: float | None = None
    upper_radius: float | None = None
    orbit_speed: float | None = None

    def show_orthographic(self, view: OrthographicView) -> None:
        self.orthographic = view

    def show_orbit(self, view: OrbitView) -> None:
        self.orbit = view
        self.lower_radius = view.lower_radius
        self.upper_radius = view.upper_radius

    def set_radius_limits(self, lower: float, upper: float) -> None:
        self.lower_radius = lower
        self.upper_radius = upper

    def set_orbit_speed(self, speed: float) -> None:
        self.orbit_speed = speed


@dataclass
class FakePicker:
    """Returns canned picks. ``None`` means a miss."""

    plane_point: Vec3 | None = None
    sphere_point: Vec3 | None = None
    plane_calls: list[tuple[float, float]] = field(default_factory=list)
    sphere_calls: list[tuple[float, float]] = field(default_factory=list)

    def pick_xy_plane(self, x_px: float, y_px: float) -> Vec3 | None:
        self.plane_calls.append((x_px, y_px))
        return self.plane_point

    def pick_sphere(self, x_px: float, y_px: float) -> Vec3 | None:
        self.sphere_calls.append((x_px, y_px))
        return self.sphere_point


@dataclass
class FakeRaySource:
    """Display-ray stub."""

    ray: Ray | None = None

    def ray_through_pixel(self, x_px: float, y_px: float) -> Ray | None:
        del x_px, y_px
        return self.ray


@dataclass
class FakeEffect:
    """Records burst requests and can be disposed."""

    positions: list[Vec3] = field(default_factory=list)
    steps: list[float] = field(default_factory=list)
    disposed: bool = False

    def spawn_burst(self, position: Vec3) -> None:
        self.positions.append(position)

    def step(self, delta_seconds: float) -> None:
        self.steps.append(delta_seconds)

    def dispose(self) -> None:
        self.disposed = True
        self.positions.clear()

    @property
    def active_count(self) -> int:
        return 0 if self.disposed else len(self.positions)


@dataclass
class FakeTimer:
    """Records start/stop and can fire one tick."""

    callback: Callable[[float], None] | None = None
    running: bool = False
    start_count: int = 0
    stop_count: int = 0

    def start(self, on_tick: Callable[[float], None]) -> None:
        self.callback = on_tick
        self.running = True
        self.start_count += 1

    def stop(self) -> None:
        self.running = False
        self.callback = None
        self.stop_count += 1

    def fire(self, delta_seconds: float) -> None:
        if self.callback is not None:
            self.callback(delta_seconds)

    @property
    def is_running(self) -> bool:
        return self.running


@dataclass
class FakeView:
    """Stand-in for a trame plotter view."""

    updates: int = 0

    def update(self) -> None:
        self.updates += 1


class ScriptedRandom:
    """``random.Random`` substitute whose ``random`` returns a script."""

    def __init__(self, values: list[float]) -> None:
        self._values = list(values)
        self._index = 0

    def random(self) -> float:
        value = self._values[self._index]
        self._index += 1
        return value
