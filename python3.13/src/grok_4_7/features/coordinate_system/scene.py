"""Coordinate-system scene. Depends on renderer and camera ports, not a plotter."""

from __future__ import annotations

from grok_4_7.features.coordinate_system.constants import (
    BACKGROUND,
    CAMERA_DISTANCE,
    DEFAULT_SCALE,
    GRID_COLOR,
    GRID_NAME,
    HALF_EXTENT,
    MAX_SCALE,
    MIN_SCALE,
    PARALLEL_SCALE,
    SQUARE_CENTER_X,
    SQUARE_CENTER_Y,
    SQUARE_COLOR,
    SQUARE_NAME,
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
    is_valid_scale,
)
from grok_4_7.math_types import ORIGIN, Vec3
from grok_4_7.ports import CameraController, MeshDisplay, OrthographicView, SceneRenderer, Transform


class CoordinateScene:
    """Draws the grid, two axes, labels, and one scalable square."""

    def __init__(self, renderer: SceneRenderer, camera: CameraController) -> None:
        self._renderer = renderer
        self._camera = camera
        self._scale = DEFAULT_SCALE
        self._is_built = False

    @property
    def square_scale(self) -> float:
        """Current uniform XY scale of the origin square."""
        return self._scale

    def build(self) -> None:
        """Create the static view. A second call does not duplicate actors."""
        if self._is_built:
            return
        self._renderer.set_background(BACKGROUND)
        self._camera.show_orthographic(self._orthographic_view())
        self._add_static_meshes()
        self._add_labels()
        self._add_square()
        self._is_built = True

    def set_square_scale(self, scale: float) -> None:
        """Set the square scale. Raises ``ValueError`` outside ``[0.5, 3]``."""
        if not is_valid_scale(scale, MIN_SCALE, MAX_SCALE):
            raise ValueError("square scale must be finite and within [0.5, 3]")
        self._scale = float(scale)
        if self._is_built:
            self._renderer.set_transform(SQUARE_NAME, self._square_transform())
            self._renderer.refresh()

    def step(self, delta_seconds: float) -> None:
        """No-op. The grid does not animate; the page timer can still call this."""
        del delta_seconds

    def dispose(self) -> None:
        """Clear actors. Safe before ``build`` and safe to call twice."""
        self._renderer.clear()
        self._is_built = False

    def _add_static_meshes(self) -> None:
        self._renderer.add_mesh(build_grid(), MeshDisplay(GRID_NAME, GRID_COLOR, style="wireframe"))
        self._renderer.add_mesh(
            build_axis_line("x", float(HALF_EXTENT)),
            MeshDisplay(X_AXIS_NAME, X_AXIS_COLOR, style="wireframe"),
        )
        self._renderer.add_mesh(
            build_axis_line("y", float(HALF_EXTENT)),
            MeshDisplay(Y_AXIS_NAME, Y_AXIS_COLOR, style="wireframe"),
        )

    def _add_labels(self) -> None:
        for text, position in axis_label_anchors("x"):
            self._renderer.add_label(text, position, name=f"label-x-{text}")
        for text, position in axis_label_anchors("y"):
            self._renderer.add_label(text, position, name=f"label-y-{text}")

    def _add_square(self) -> None:
        self._renderer.add_mesh(build_square(), MeshDisplay(SQUARE_NAME, SQUARE_COLOR))
        self._renderer.set_transform(SQUARE_NAME, self._square_transform())
        self._renderer.refresh()

    def _square_transform(self) -> Transform:
        return Transform(Vec3(SQUARE_CENTER_X, SQUARE_CENTER_Y, 0.0), Vec3(0.0, 0.0, 0.0), self._scale)

    def _orthographic_view(self) -> OrthographicView:
        return OrthographicView(
            Vec3(0.0, 0.0, CAMERA_DISTANCE),
            ORIGIN,
            Vec3(0.0, 1.0, 0.0),
            PARALLEL_SCALE,
        )
