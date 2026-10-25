"""Cube mesh and color checks. No plotter is constructed here."""

from __future__ import annotations

import re

import pyvista as pv

from grok_4_7.features.coordinate_system.geometry import build_axis_line
from grok_4_7.features.cube_3d.constants import AXES, AXIS_LENGTH, DEFAULT_COLOR
from grok_4_7.math_types import Vec3

_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


def is_hex_color(color: str) -> bool:
    """Return whether ``color`` is ``#`` plus six hex digits."""
    return _COLOR_PATTERN.fullmatch(color) is not None


def build_cube() -> pv.PolyData:
    """Return a unit cube centered on the origin. Scale is applied by the scene."""
    return pv.Cube()


def build_colored_axis(axis: str) -> pv.PolyData:
    """Return one axis line of the single-cube length."""
    if axis not in AXES:
        raise ValueError(f"axis must be x, y, or z, got {axis!r}")
    return build_axis_line(axis, AXIS_LENGTH)


def axis_color(axis: str) -> str:
    """Return the contract color for ``axis``."""
    colors = {"x": "#ff0000", "y": "#00ff00", "z": "#0000ff"}
    try:
        return colors[axis]
    except KeyError:
        raise ValueError(f"axis must be x, y, or z, got {axis!r}") from None


def add_axis_rotation(orientation: Vec3, axis: str, delta_radians: float) -> Vec3:
    """Add ``delta_radians`` on one axis and leave the other two unchanged."""
    if axis == "x":
        return Vec3(orientation.x + delta_radians, orientation.y, orientation.z)
    if axis == "z":
        return Vec3(orientation.x, orientation.y, orientation.z + delta_radians)
    return Vec3(orientation.x, orientation.y + delta_radians, orientation.z)


def default_color() -> str:
    """Return the cube color used before the user edits the field."""
    return DEFAULT_COLOR
