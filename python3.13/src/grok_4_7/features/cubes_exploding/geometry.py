"""Boundary sphere and unit cube meshes for the exploding view."""

from __future__ import annotations

import pyvista as pv

from grok_4_7.features.cubes_exploding.constants import SPHERE_SEGMENTS


def build_boundary_sphere(segments: int = SPHERE_SEGMENTS) -> pv.PolyData:
    """Return a unit sphere. The scene scales it to the sphere radius."""
    return pv.Sphere(radius=1.0, theta_resolution=segments, phi_resolution=segments)


def build_unit_cube() -> pv.PolyData:
    """Return a unit cube. Actor scale equals the random edge length."""
    return pv.Cube()
