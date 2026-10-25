"""Pure ray intersection used by click-to-world picking."""

from __future__ import annotations

from dataclasses import dataclass

from grok_4_7.math_types import Vec3

_PARALLEL_EPSILON = 1e-9


@dataclass(frozen=True, slots=True)
class Ray:
    """World-space ray. ``direction`` is expected to be normalized."""

    origin: Vec3
    direction: Vec3


def intersect_xy_plane(ray: Ray) -> Vec3 | None:
    """Return the hit on ``z = 0``, or ``None`` when the ray misses it."""
    if abs(ray.direction.z) < _PARALLEL_EPSILON:
        return None
    distance = -ray.origin.z / ray.direction.z
    if distance < 0:
        return None
    return ray.origin.added(ray.direction.scaled(distance))


def intersect_sphere(ray: Ray, radius: float) -> Vec3 | None:
    """Return the nearest forward hit on a sphere centered at the origin."""
    if radius <= 0:
        return None
    offset = ray.origin
    direction = ray.direction
    quadratic_b = 2.0 * offset.dot(direction)
    quadratic_c = offset.dot(offset) - radius * radius
    discriminant = quadratic_b * quadratic_b - 4.0 * quadratic_c
    if discriminant < 0:
        return None
    root = discriminant**0.5
    near = (-quadratic_b - root) / 2.0
    far = (-quadratic_b + root) / 2.0
    distance = _first_forward(near, far)
    if distance is None:
        return None
    return ray.origin.added(ray.direction.scaled(distance))


def _first_forward(near: float, far: float) -> float | None:
    if near >= 0:
        return near
    if far >= 0:
        return far
    return None
