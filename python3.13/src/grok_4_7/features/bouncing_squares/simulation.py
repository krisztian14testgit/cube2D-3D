"""Square collection and one simulation step. No PyVista imports."""

from __future__ import annotations

import random
from collections.abc import Sequence
from dataclasses import dataclass

from grok_4_7.features.bouncing_squares.constants import DEFAULT_MAX_SQUARES
from grok_4_7.features.bouncing_squares.math import (
    SquareState,
    apply_wall_bounce,
    clamp_max_squares,
    integrate_square,
    is_inside_bounds,
    random_angular_speed,
    random_edge,
    random_velocity,
    removal_order,
)
from grok_4_7.math_types import Vec3


@dataclass(frozen=True, slots=True)
class SquareStep:
    """Survivors in original order. Removed names are highest index first."""

    survivors: tuple[SquareState, ...]
    removed_names: tuple[str, ...]


class BouncingSimulation:
    """Owns square state. The scene mirrors the result onto a renderer."""

    def __init__(
        self,
        rng: random.Random,
        squares: Sequence[SquareState] | None = None,
        max_squares: int = DEFAULT_MAX_SQUARES,
    ) -> None:
        self._rng = rng
        self._squares = list(squares or ())
        self._max_squares = clamp_max_squares(max_squares)
        self._next_id = _next_id(self._squares)

    @property
    def square_count(self) -> int:
        """Number of squares still in the simulation."""
        return len(self._squares)

    @property
    def max_squares(self) -> int:
        """Current spawn cap. Existing squares are not deleted to meet it."""
        return self._max_squares

    @property
    def squares(self) -> tuple[SquareState, ...]:
        """Current squares in spawn order, after the last step."""
        return tuple(self._squares)

    def spawn_at(self, point: Vec3) -> SquareState | None:
        """Spawn one square, or return ``None`` when the click is ignored."""
        if not is_inside_bounds(point) or self.square_count >= self._max_squares:
            return None
        state = self._new_square(point)
        self._squares.append(state)
        return state

    def set_max_squares(self, value: float) -> int:
        """Clamp and store the cap. Does not delete squares."""
        self._max_squares = clamp_max_squares(value)
        return self._max_squares

    def step(self, delta_seconds: float) -> SquareStep:
        """Integrate, bounce, then remove every overlapping index once."""
        if not self._squares:
            return SquareStep((), ())
        moved = [apply_wall_bounce(integrate_square(square, delta_seconds)) for square in self._squares]
        order = removal_order(moved)
        removed = tuple(moved[index].name for index in order)
        doomed = set(order)
        self._squares = [square for index, square in enumerate(moved) if index not in doomed]
        return SquareStep(tuple(self._squares), removed)

    def clear(self) -> None:
        """Drop every square. Safe to call twice."""
        self._squares.clear()

    def _new_square(self, point: Vec3) -> SquareState:
        name = f"square-{self._next_id}"
        self._next_id += 1
        return SquareState(
            name,
            Vec3(point.x, point.y, 0.0),
            random_velocity(self._rng),
            random_edge(self._rng),
            0.0,
            random_angular_speed(self._rng),
        )


def _next_id(squares: Sequence[SquareState]) -> int:
    return len(squares) + 1
