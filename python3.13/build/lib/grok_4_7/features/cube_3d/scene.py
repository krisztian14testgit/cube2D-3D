"""Single-cube scene. The cube stays at the origin and rotates over time."""

from __future__ import annotations

import math

from grok_4_7.errors import InvalidAxisError, InvalidColorError
from grok_4_7.features.coordinate_system.geometry import is_valid_scale
from grok_4_7.features.cube_3d.constants import (
    AXES,
    CAMERA_RADIUS,
    CUBE_NAME,
    DEFAULT_AXIS,
    DEFAULT_COLOR,
    DEFAULT_ROTATION_SPEED,
    DEFAULT_SCALE,
    MAX_ROTATION_SPEED,
    MAX_SCALE,
    MIN_ROTATION_SPEED,
    MIN_SCALE,
    STATUS_ACTIVE,
    STATUS_CLICK,
)
from grok_4_7.features.cube_3d.geometry import (
    add_axis_rotation,
    axis_color,
    build_colored_axis,
    build_cube,
    is_hex_color,
)
from grok_4_7.math_types import ORIGIN, Vec3
from grok_4_7.numbers import is_finite_number
from grok_4_7.ports import CameraController, LifecyclePort, MeshDisplay, OrbitView, SceneRenderer, Transform


class CubeScene:
    """Creates at most one cube and rotates it on the selected axis."""

    def __init__(
        self,
        renderer: SceneRenderer,
        camera: CameraController,
        lifecycle: LifecyclePort,
    ) -> None:
        self._renderer = renderer
        self._camera = camera
        self._lifecycle = lifecycle
        self._has_cube = False
        self._is_built = False
        self._axis = DEFAULT_AXIS
        self._speed = DEFAULT_ROTATION_SPEED
        self._scale = DEFAULT_SCALE
        self._color = DEFAULT_COLOR
        self._orientation = ORIGIN

    @property
    def has_cube(self) -> bool:
        """Whether the interactive cube exists."""
        return self._has_cube

    @property
    def orientation_radians(self) -> Vec3:
        """Accumulated rotation. Only the active axis changes during ``step``."""
        return self._orientation

    @property
    def rotation_axis(self) -> str:
        """Active rotation axis."""
        return self._axis

    @property
    def status_text(self) -> str:
        """Prompt before the cube exists, then the active-controls message."""
        if self._has_cube:
            return STATUS_ACTIVE
        return STATUS_CLICK

    def build(self) -> None:
        """Draw axes and register lifecycle hooks. Does not create the cube."""
        if self._is_built:
            return
        self._camera.show_orbit(self._orbit_view())
        for axis in AXES:
            self._renderer.add_mesh(
                build_colored_axis(axis),
                MeshDisplay(f"{axis}-axis", axis_color(axis), style="wireframe"),
            )
        self._lifecycle.register_resize(self._on_resize)
        self._lifecycle.register_tick(self.step)
        self._is_built = True
        self._renderer.refresh()

    def create_cube_if_missing(self) -> bool:
        """Create the origin cube once. Returns ``False`` when it already exists."""
        if not self._is_built or self._has_cube:
            return False
        self._renderer.add_mesh(build_cube(), MeshDisplay(CUBE_NAME, self._color))
        self._renderer.set_transform(CUBE_NAME, self._transform())
        self._has_cube = True
        self._renderer.refresh()
        return True

    def set_cube_scale(self, scale: float) -> bool:
        """Scale the cube. A call before the cube exists is a no-op and returns ``False``."""
        if not self._has_cube:
            return False
        if not is_valid_scale(scale, MIN_SCALE, MAX_SCALE):
            raise ValueError("cube scale must be finite and within [0.5, 3]")
        self._scale = float(scale)
        self._push()
        return True

    def set_rotation_axis(self, axis: str) -> None:
        """Select ``x``, ``y``, or ``z``. Any other value raises ``InvalidAxisError``."""
        if axis not in AXES:
            raise InvalidAxisError(axis)
        self._axis = axis

    def set_rotation_speed(self, speed: float) -> None:
        """Set radians per second. Values outside ``[0, 6]`` raise ``ValueError``."""
        if not is_finite_number(speed) or not MIN_ROTATION_SPEED <= float(speed) <= MAX_ROTATION_SPEED:
            raise ValueError("rotation speed must be finite and within [0, 6]")
        self._speed = float(speed)

    def set_cube_color(self, color_hex: str) -> None:
        """Store a ``#RRGGBB`` color and apply it when the cube exists."""
        if not is_hex_color(color_hex):
            raise InvalidColorError(color_hex)
        self._color = color_hex
        if self._has_cube:
            self._renderer.set_color(CUBE_NAME, color_hex)
            self._renderer.refresh()

    def step(self, delta_seconds: float) -> None:
        """Rotate by ``speed * delta_seconds`` on the selected axis only."""
        if not self._has_cube:
            return
        self._orientation = add_axis_rotation(self._orientation, self._axis, self._speed * delta_seconds)
        self._push()

    def dispose(self) -> None:
        """Drop the cube, axes, and lifecycle hooks. Safe before build and safe twice."""
        self._lifecycle.unregister(self._on_resize)
        self._lifecycle.unregister(self.step)
        self._renderer.clear()
        self._has_cube = False
        self._is_built = False
        self._orientation = ORIGIN

    def _on_resize(self) -> None:
        self._renderer.refresh()

    def _push(self) -> None:
        self._renderer.set_transform(CUBE_NAME, self._transform())
        self._renderer.refresh()

    def _transform(self) -> Transform:
        return Transform(ORIGIN, self._orientation, self._scale)

    def _orbit_view(self) -> OrbitView:
        return OrbitView(math.pi / 4, math.pi / 3, CAMERA_RADIUS, ORIGIN, 4.0, 40.0)
