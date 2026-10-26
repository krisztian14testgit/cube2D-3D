"""Bouncing-square scene. Physics stays in the simulation; this class draws it."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass

from grok_4_7.features.bouncing_squares.constants import (
    BACKGROUND,
    DEFAULT_MAX_SQUARES,
    MAX_SUBSTEP_SECONDS,
    SQUARE_COLOR,
)
from grok_4_7.features.bouncing_squares.math import SquareState, format_square_status
from grok_4_7.features.bouncing_squares.simulation import BouncingSimulation
from grok_4_7.features.coordinate_system.constants import (
    CAMERA_DISTANCE,
    GRID_COLOR,
    GRID_NAME,
    HALF_EXTENT,
    PARALLEL_SCALE,
    X_AXIS_COLOR,
    X_AXIS_NAME,
    Y_AXIS_COLOR,
    Y_AXIS_NAME,
)
from grok_4_7.features.coordinate_system.geometry import (
    axis_label_anchors,
    build_axis_line,
    build_grid,
    build_square,
)
from grok_4_7.math_types import ORIGIN, Vec3
from grok_4_7.ports import (
    CameraController,
    LifecyclePort,
    MeshDisplay,
    OrthographicView,
    SceneRenderer,
    Transform,
)


@dataclass(frozen=True, slots=True)
class BouncingServices:
    """Collaborators for the bouncing-square scene."""

    renderer: SceneRenderer
    camera: CameraController
    rng: random.Random
    lifecycle: LifecyclePort


class BouncingSquaresScene:
    """Spawns squares from world points and mirrors the simulation onto a renderer."""

    def __init__(self, services: BouncingServices, max_squares: int = DEFAULT_MAX_SQUARES) -> None:
        self._renderer = services.renderer
        self._camera = services.camera
        self._lifecycle = services.lifecycle
        self._simulation = BouncingSimulation(services.rng, max_squares=max_squares)
        self._mesh = build_square()
        self._is_built = False

    @property
    def square_count(self) -> int:
        """Active square count."""
        return self._simulation.square_count

    @property
    def max_squares(self) -> int:
        """Current spawn cap."""
        return self._simulation.max_squares

    @property
    def status_text(self) -> str:
        """Status line ``Squares: {count} / {max}``."""
        return format_square_status(self.square_count, self.max_squares)

    @property
    def squares(self) -> tuple[SquareState, ...]:
        """Current square states."""
        return self._simulation.squares

    def build(self) -> None:
        """Prepare the view and register the frame callback. A second call is ignored."""
        if self._is_built:
            return
        self._renderer.set_background(BACKGROUND)
        self._camera.show_orthographic(self._view())
        self._add_grid()
        self._lifecycle.register_tick(self.step)
        self._is_built = True
        self._renderer.refresh()

    def spawn_at(self, point: Vec3) -> bool:
        """Spawn one square. Returns ``False`` outside bounds, at the cap, or before build."""
        if not self._is_built:
            return False
        state = self._simulation.spawn_at(point)
        if state is None:
            return False
        self._draw(state)
        self._renderer.refresh()
        return True

    def set_max_squares(self, value: float) -> int:
        """Clamp the cap. Existing squares stay."""
        return self._simulation.set_max_squares(value)

    def set_speed(self, value: float) -> float:
        """Clamp the motion speed multiplier. Existing squares keep moving at the new pace."""
        return self._simulation.set_speed(value)

    def step(self, delta_seconds: float) -> None:
        """Advance the simulation and sync actors. Empty collections do no work."""
        if not self._is_built:
            return
        removed_names: list[str] = []
        survivors = self._simulation.squares
        for sub_delta in _substeps(delta_seconds):
            result = self._simulation.step(sub_delta)
            removed_names.extend(result.removed_names)
            survivors = result.survivors
        for name in removed_names:
            self._renderer.remove(name)
        for state in survivors:
            self._renderer.set_transform(state.name, _transform(state))
        if survivors or removed_names:
            self._renderer.refresh()

    def dispose(self) -> None:
        """Remove actors and the frame callback. Safe before build and safe twice."""
        self._lifecycle.unregister(self.step)
        self._simulation.clear()
        self._renderer.clear()
        self._is_built = False

    def _add_grid(self) -> None:
        self._renderer.add_mesh(build_grid(), MeshDisplay(GRID_NAME, GRID_COLOR, style="wireframe"))
        self._renderer.add_mesh(
            build_axis_line("x", float(HALF_EXTENT)),
            MeshDisplay(X_AXIS_NAME, X_AXIS_COLOR, style="wireframe"),
        )
        self._renderer.add_mesh(
            build_axis_line("y", float(HALF_EXTENT)),
            MeshDisplay(Y_AXIS_NAME, Y_AXIS_COLOR, style="wireframe"),
        )
        for axis in ("x", "y"):
            for text, position in axis_label_anchors(axis):
                self._renderer.add_label(text, position, name=f"label-{axis}-{text}")

    def _draw(self, state: SquareState) -> None:
        self._renderer.add_mesh(self._mesh, MeshDisplay(state.name, SQUARE_COLOR))
        self._renderer.set_transform(state.name, _transform(state))

    def _view(self) -> OrthographicView:
        return OrthographicView(
            Vec3(0.0, 0.0, CAMERA_DISTANCE),
            ORIGIN,
            Vec3(0.0, 1.0, 0.0),
            PARALLEL_SCALE,
        )


def _substeps(delta_seconds: float) -> list[float]:
    """Split a long frame so a fast square cannot skip over a wall or another square."""
    if delta_seconds <= MAX_SUBSTEP_SECONDS:
        return [delta_seconds]
    count = math.ceil(delta_seconds / MAX_SUBSTEP_SECONDS)
    return [delta_seconds / count] * count


def _transform(state: SquareState) -> Transform:
    return Transform(state.position, Vec3(0.0, 0.0, state.angle_radians), state.edge_length)
