"""Grid, axis, and square meshes. PolyData is data; this module builds no plotter."""

from __future__ import annotations

import numpy as np
import pyvista as pv

from grok_4_7.features.coordinate_system.constants import (
    HALF_EXTENT,
    LABEL_ANCHORS,
    SQUARE_EDGE,
    TICK_STEP,
)
from grok_4_7.math_types import Vec3
from grok_4_7.numbers import is_finite_number


def logical_to_world(x: float, y: float) -> Vec3:
    """Map a 2D logical point onto the XY plane. Screen-up is ``+Y``."""
    return Vec3(x, y, 0.0)


def is_valid_scale(scale: float, minimum: float, maximum: float) -> bool:
    """Return whether ``scale`` is finite and inside the closed slider range."""
    if not is_finite_number(scale):
        return False
    return minimum <= float(scale) <= maximum


def build_grid(half_extent: int = HALF_EXTENT, step: int = TICK_STEP) -> pv.PolyData:
    """Return grid lines on ``z = 0`` from ``-half_extent`` to ``+half_extent``."""
    points: list[tuple[float, float, float]] = []
    lines: list[int] = []
    for value in range(-half_extent, half_extent + 1, step):
        _append_line(points, lines, (float(value), float(-half_extent), 0.0), (float(value), float(half_extent), 0.0))
        _append_line(points, lines, (float(-half_extent), float(value), 0.0), (float(half_extent), float(value), 0.0))
    return pv.PolyData(np.array(points), lines=np.array(lines))


def build_axis_line(axis: str, length: float) -> pv.PolyData:
    """Return one axis line centered on the origin."""
    end = _axis_end(axis, length)
    points = np.array([tuple(-value for value in end), end])
    return pv.PolyData(points, lines=np.array([2, 0, 1]))


def build_square(edge_length: float = SQUARE_EDGE) -> pv.PolyData:
    """Return an axis-aligned square of ``edge_length`` centered on the origin."""
    half = edge_length / 2
    points = np.array(
        [[-half, -half, 0.0], [half, -half, 0.0], [half, half, 0.0], [-half, half, 0.0]],
    )
    return pv.PolyData(points, faces=np.array([4, 0, 1, 2, 3]))


def axis_label_anchors(axis: str) -> tuple[tuple[str, Vec3], ...]:
    """Return label text and a slightly offset anchor so the glyph clears the axis."""
    return tuple(_label(axis, anchor) for anchor in LABEL_ANCHORS)


def _label(axis: str, anchor: int) -> tuple[str, Vec3]:
    if axis == "x":
        return str(anchor), Vec3(float(anchor), -0.6, 0.0)
    return str(anchor), Vec3(-0.6, float(anchor), 0.0)


def _append_line(
    points: list[tuple[float, float, float]],
    lines: list[int],
    start: tuple[float, float, float],
    end: tuple[float, float, float],
) -> None:
    index = len(points)
    points.extend((start, end))
    lines.extend((2, index, index + 1))


def _axis_end(axis: str, length: float) -> tuple[float, float, float]:
    if axis == "x":
        return (length, 0.0, 0.0)
    if axis == "y":
        return (0.0, length, 0.0)
    if axis == "z":
        return (0.0, 0.0, length)
    raise ValueError(f"axis must be x, y, or z, got {axis!r}")
