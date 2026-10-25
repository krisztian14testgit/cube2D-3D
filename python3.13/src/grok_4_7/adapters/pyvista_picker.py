"""Click picking. Ray math stays in ``picking``; this module only reads the plotter."""

from __future__ import annotations

from collections.abc import Callable

from grok_4_7.math_types import Vec3
from grok_4_7.picking import Ray, intersect_sphere, intersect_xy_plane
from grok_4_7.ports import DisplayRaySource


class RayPicker:
    """ViewPicker implemented with an injected ray source."""

    def __init__(self, rays: DisplayRaySource, radius_of: Callable[[], float]) -> None:
        self._rays = rays
        self._radius_of = radius_of

    def pick_xy_plane(self, x_px: float, y_px: float) -> Vec3 | None:
        """Intersect the pixel ray with ``z = 0``."""
        ray = self._rays.ray_through_pixel(x_px, y_px)
        if ray is None:
            return None
        return intersect_xy_plane(ray)

    def pick_sphere(self, x_px: float, y_px: float) -> Vec3 | None:
        """Intersect the pixel ray with the current sphere radius."""
        ray = self._rays.ray_through_pixel(x_px, y_px)
        if ray is None:
            return None
        return intersect_sphere(ray, self._radius_of())


class PlotterRaySource:
    """Builds a world ray from a plotter renderer. Returns ``None`` without one."""

    def __init__(self, plotter: object) -> None:
        self._plotter = plotter

    def ray_through_pixel(self, x_px: float, y_px: float) -> Ray | None:
        """Convert a display pixel to a world ray."""
        renderer = getattr(self._plotter, "renderer", None)
        if renderer is None:
            return None
        return ray_from_display(renderer, x_px, y_px)


def ray_from_display(renderer: object, x_px: float, y_px: float) -> Ray | None:
    """Use VTK display-to-world on the near and far planes."""
    near = _world_point(renderer, x_px, y_px, 0.0)
    far = _world_point(renderer, x_px, y_px, 1.0)
    if near is None or far is None:
        return None
    direction = far.subtracted(near)
    length = direction.length()
    if length == 0.0:
        return None
    return Ray(near, direction.scaled(1.0 / length))


def _world_point(renderer: object, x_px: float, y_px: float, depth: float) -> Vec3 | None:
    renderer.SetDisplayPoint(x_px, y_px, depth)
    renderer.DisplayToWorld()
    raw = renderer.GetWorldPoint()
    return _from_homogeneous(raw)


def _from_homogeneous(raw: object) -> Vec3 | None:
    values = tuple(raw)
    if len(values) < 3:
        return None
    weight = float(values[3]) if len(values) > 3 else 1.0
    if weight == 0.0:
        return None
    return Vec3(float(values[0]) / weight, float(values[1]) / weight, float(values[2]) / weight)
