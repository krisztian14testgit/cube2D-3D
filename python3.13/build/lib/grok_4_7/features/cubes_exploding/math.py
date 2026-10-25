"""Parity port of Grok 4.5 ``cubesExplodingMath.js``.

Linear and angular magnitudes are in units per second so a ``1/60`` step
matches one JavaScript frame. This module does not import a renderer.
"""

from __future__ import annotations

import math
import random
from collections.abc import Sequence
from dataclasses import dataclass

from grok_4_7.features.cubes_exploding.constants import (
    ANGULAR_SPEED,
    DEFAULT_CAMERA_ROTATION_SPEED,
    DIFFUSE_FLOOR,
    DIFFUSE_SPAN,
    LINEAR_SPEED,
    MAX_CAMERA_ROTATION_SPEED,
    MAX_CUBE_SCALE,
    MAX_MAX_CUBES,
    MIN_CAMERA_ROTATION_SPEED,
    MIN_CUBE_SCALE,
    MIN_MAX_CUBES,
    SPAWN_SHRINK,
)
from grok_4_7.math_types import Vec3
from grok_4_7.numbers import is_finite_number, round_half_up


@dataclass(frozen=True, slots=True)
class CollisionSample:
    """Sphere approximation used by the pairwise collision test."""

    position: Vec3
    half_extent: float


def clamp_max_cubes(
    value: float,
    minimum: int = MIN_MAX_CUBES,
    maximum: int = MAX_MAX_CUBES,
) -> int:
    """Clamp a max-cube setting. Non-finite input becomes ``minimum``."""
    if not is_finite_number(value):
        return minimum
    rounded = round_half_up(float(value))
    return min(maximum, max(minimum, rounded))


def clamp_camera_rotation_speed(
    value: float,
    minimum: float = MIN_CAMERA_ROTATION_SPEED,
    maximum: float = MAX_CAMERA_ROTATION_SPEED,
) -> float:
    """Clamp orbit sensitivity. Non-finite input becomes the default."""
    if not is_finite_number(value):
        return DEFAULT_CAMERA_ROTATION_SPEED
    return min(maximum, max(minimum, float(value)))


def random_cube_scale(
    rng: random.Random,
    minimum: float = MIN_CUBE_SCALE,
    maximum: float = MAX_CUBE_SCALE,
) -> float:
    """Return an edge length in ``[minimum, maximum)`` for ``rng.random``."""
    return minimum + rng.random() * (maximum - minimum)


def random_velocity(rng: random.Random, magnitude: float = LINEAR_SPEED) -> Vec3:
    """Return a per-second linear velocity."""
    return _random_vec(rng, magnitude)


def random_rotation_speed(rng: random.Random, magnitude: float = ANGULAR_SPEED) -> Vec3:
    """Return a per-second angular velocity in radians."""
    return _random_vec(rng, magnitude)


def random_diffuse_channel(rng: random.Random) -> float:
    """Return one diffuse color channel in ``[0.3, 1.0)``."""
    return DIFFUSE_FLOOR + rng.random() * DIFFUSE_SPAN


def random_diffuse_hex(rng: random.Random) -> str:
    """Return a diffuse ``#rrggbb`` color drawn from ``rng``."""
    channels = [random_diffuse_channel(rng) for _ in range(3)]
    return _rgb_hex(channels[0], channels[1], channels[2])


def cube_half_extent(scale: float) -> float:
    """Return the bounding-sphere radius of a cube with edge ``scale``."""
    return (scale * math.sqrt(3)) / 2


def distance3(left: Vec3, right: Vec3) -> float:
    """Return the distance between two points."""
    return left.subtracted(right).length()


def vector_length(vector: Vec3) -> float:
    """Return the length of ``vector``."""
    return vector.length()


def dot3(left: Vec3, right: Vec3) -> float:
    """Return the dot product."""
    return left.dot(right)


def collect_collision_indexes(cubes: Sequence[CollisionSample]) -> list[int]:
    """Return unique indexes involved in a strict bounding-sphere overlap."""
    hits: list[int] = []
    seen: set[int] = set()
    for left_index, left in enumerate(cubes):
        _collect_partners(cubes, left_index, left, hits, seen)
    return hits


def sort_indexes_descending(indexes: Sequence[int]) -> list[int]:
    """Return a new list sorted from highest index to lowest."""
    return sorted(indexes, reverse=True)


def should_bounce_off_sphere(
    position: Vec3,
    velocity: Vec3,
    sphere_radius: float,
    cube_half_extent_value: float,
) -> bool:
    """Bounce only when the center is outside the inner limit and moving out."""
    limit = max(0.0, sphere_radius - cube_half_extent_value)
    if vector_length(position) <= limit:
        return False
    return dot3(position, velocity) > 0


def bounce_velocity(velocity: Vec3) -> Vec3:
    """Reverse velocity and coerce ``-0.0`` to ``0.0``."""
    return Vec3(_negate(velocity.x), _negate(velocity.y), _negate(velocity.z))


def clamp_point_inside_sphere(
    point: Vec3,
    sphere_radius: float,
    cube_half_extent_value: float,
    shrink: float = SPAWN_SHRINK,
) -> Vec3:
    """Keep a spawn point inside the sphere with the JavaScript shrink margin."""
    max_distance = max(0.01, (sphere_radius - cube_half_extent_value) * shrink)
    length = vector_length(point)
    if length == 0.0 or length <= max_distance:
        return point
    return point.scaled(max_distance / length)


def camera_upper_radius(sphere_scale: float) -> float:
    """Return the wheel-zoom upper radius for the current sphere."""
    return max(40.0, sphere_scale * 6.0)


def format_cube_status(count: int, maximum: int) -> str:
    """Return the status line shown beside the exploding view."""
    return f"Cubes: {count} / {maximum}"


def _random_vec(rng: random.Random, magnitude: float) -> Vec3:
    return Vec3(_signed(rng, magnitude), _signed(rng, magnitude), _signed(rng, magnitude))


def _signed(rng: random.Random, magnitude: float) -> float:
    return (rng.random() - 0.5) * 2.0 * magnitude


def _negate(value: float) -> float:
    negated = -value
    if negated == 0.0:
        return 0.0
    return negated


def _rgb_hex(red: float, green: float, blue: float) -> str:
    return f"#{_channel(red):02x}{_channel(green):02x}{_channel(blue):02x}"


def _channel(value: float) -> int:
    return max(0, min(255, round(value * 255)))


def _collect_partners(
    cubes: Sequence[CollisionSample],
    left_index: int,
    left: CollisionSample,
    hits: list[int],
    seen: set[int],
) -> None:
    for right_index in range(left_index + 1, len(cubes)):
        right = cubes[right_index]
        if distance3(left.position, right.position) < left.half_extent + right.half_extent:
            _remember(hits, seen, left_index)
            _remember(hits, seen, right_index)


def _remember(hits: list[int], seen: set[int], index: int) -> None:
    if index not in seen:
        seen.add(index)
        hits.append(index)
