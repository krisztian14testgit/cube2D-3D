"""Wall, collision, and spawn math for bouncing squares. No renderer imports."""

from __future__ import annotations

import math
import random
from collections.abc import Sequence
from dataclasses import dataclass, replace

from grok_4_7.features.bouncing_squares.constants import (
    DEFAULT_MAX_SQUARES,
    HALF_EXTENT,
    MAX_ANGULAR_SPEED,
    MAX_EDGE,
    MAX_MAX_SQUARES,
    MAX_VELOCITY,
    MIN_ANGULAR_SPEED,
    MIN_EDGE,
    MIN_MAX_SQUARES,
    MIN_VELOCITY,
)
from grok_4_7.math_types import Vec3
from grok_4_7.numbers import is_finite_number, round_half_up


@dataclass(frozen=True, slots=True)
class SquareState:
    """One square. Rotation is around Z only. Velocity is world-units per second."""

    name: str
    position: Vec3
    velocity: Vec3
    edge_length: float
    angle_radians: float
    angular_speed: float


def bounding_radius(edge_length: float) -> float:
    """Return the circle radius that contains the square at any Z rotation."""
    return edge_length * math.sqrt(2) / 2


def is_inside_bounds(point: Vec3, half_extent: float = HALF_EXTENT) -> bool:
    """Return whether ``point`` lies in the closed square ``[-half, half]``."""
    return abs(point.x) <= half_extent and abs(point.y) <= half_extent


def clamp_max_squares(value: float) -> int:
    """Clamp the max-count control. Non-finite input becomes the default."""
    if not is_finite_number(value):
        return DEFAULT_MAX_SQUARES
    rounded = round_half_up(float(value))
    return min(MAX_MAX_SQUARES, max(MIN_MAX_SQUARES, rounded))


def random_edge(rng: random.Random) -> float:
    """Return an edge length in ``[0.4, 1.6)``."""
    return _uniform(rng, MIN_EDGE, MAX_EDGE)


def random_velocity(rng: random.Random) -> Vec3:
    """Return a planar velocity whose components are in ``[-3, 3)``."""
    return Vec3(_uniform(rng, MIN_VELOCITY, MAX_VELOCITY), _uniform(rng, MIN_VELOCITY, MAX_VELOCITY), 0.0)


def random_angular_speed(rng: random.Random) -> float:
    """Return a Z angular speed in ``[-2, 2)`` radians per second."""
    return _uniform(rng, MIN_ANGULAR_SPEED, MAX_ANGULAR_SPEED)


def integrate_square(state: SquareState, delta_seconds: float) -> SquareState:
    """Move and spin. A zero delta leaves the center where it is."""
    position = Vec3(
        state.position.x + state.velocity.x * delta_seconds,
        state.position.y + state.velocity.y * delta_seconds,
        0.0,
    )
    return replace(state, position=position, angle_radians=state.angle_radians + state.angular_speed * delta_seconds)


def apply_wall_bounce(state: SquareState, half_extent: float = HALF_EXTENT) -> SquareState:
    """Reverse only an outward component, and only once the center is past the limit."""
    limit = half_extent - bounding_radius(state.edge_length)
    x_pos, x_vel = _bounce_axis(state.position.x, state.velocity.x, limit)
    y_pos, y_vel = _bounce_axis(state.position.y, state.velocity.y, limit)
    return replace(state, position=Vec3(x_pos, y_pos, 0.0), velocity=Vec3(x_vel, y_vel, 0.0))


def collision_indexes(states: Sequence[SquareState]) -> list[int]:
    """Return indexes whose circles strictly overlap. Exact contact is not a hit."""
    hits: list[int] = []
    seen: set[int] = set()
    for left_index, left in enumerate(states):
        _partners(states, left_index, left, hits, seen)
    return hits


def removal_order(states: Sequence[SquareState]) -> list[int]:
    """Return colliding indexes once each, highest first."""
    return sorted(collision_indexes(states), reverse=True)


def format_square_status(count: int, maximum: int) -> str:
    """Return the status line shown beside the bouncing view."""
    return f"Squares: {count} / {maximum}"


def _uniform(rng: random.Random, low: float, high: float) -> float:
    return low + rng.random() * (high - low)


def _bounce_axis(center: float, velocity: float, limit: float) -> tuple[float, float]:
    if center > limit and velocity > 0:
        return limit, -velocity
    if center < -limit and velocity < 0:
        return -limit, -velocity
    return center, velocity


def _partners(
    states: Sequence[SquareState],
    left_index: int,
    left: SquareState,
    hits: list[int],
    seen: set[int],
) -> None:
    for right_index in range(left_index + 1, len(states)):
        right = states[right_index]
        if _overlaps(left, right):
            _remember(hits, seen, left_index)
            _remember(hits, seen, right_index)


def _overlaps(left: SquareState, right: SquareState) -> bool:
    distance = math.hypot(left.position.x - right.position.x, left.position.y - right.position.y)
    threshold = bounding_radius(left.edge_length) + bounding_radius(right.edge_length)
    return distance < threshold


def _remember(hits: list[int], seen: set[int], index: int) -> None:
    if index not in seen:
        seen.add(index)
        hits.append(index)
