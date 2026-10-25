"""Wall, collision, and spawn rules for bouncing squares."""

from __future__ import annotations

import math

import pytest
from tests.fakes.renderers import ScriptedRandom

from grok_4_7.features.bouncing_squares.math import (
    SquareState,
    apply_wall_bounce,
    bounding_radius,
    clamp_max_squares,
    collision_indexes,
    format_square_status,
    integrate_square,
    is_inside_bounds,
    random_angular_speed,
    random_edge,
    random_velocity,
    removal_order,
)
from grok_4_7.features.bouncing_squares.simulation import BouncingSimulation
from grok_4_7.math_types import Vec3


def _square(name: str, x: float, edge: float, velocity_x: float = 0.0) -> SquareState:
    return SquareState(name, Vec3(x, 0.0, 0.0), Vec3(velocity_x, 0.0, 0.0), edge, 0.0, 0.0)


def test_clamp_max_squares__non_finite__uses_default() -> None:
    assert clamp_max_squares(float("nan")) == 20


def test_clamp_max_squares__outside_slider__clamps() -> None:
    assert clamp_max_squares(4.4) == 5
    assert clamp_max_squares(40.6) == 40


def test_is_inside_bounds__closed_interval__includes_edge() -> None:
    assert is_inside_bounds(Vec3(10, -10, 4)) is True
    assert is_inside_bounds(Vec3(10.1, 0, 0)) is False


def test_random_ranges__scripted_draws__hit_the_formula_ends() -> None:
    assert random_edge(ScriptedRandom([0.0])) == pytest.approx(0.4)  # type: ignore[arg-type]
    velocity = random_velocity(ScriptedRandom([0.0, 1.0]))  # type: ignore[arg-type]
    assert velocity.x == pytest.approx(-3)
    assert velocity.y == pytest.approx(3)
    assert random_angular_speed(ScriptedRandom([1.0])) == pytest.approx(2)  # type: ignore[arg-type]


def test_apply_wall_bounce__outward_axis_only__negates_and_clamps() -> None:
    bounced = apply_wall_bounce(_square("s", 9.9, 0.4, 3.0))
    limit = 10 - bounding_radius(0.4)
    assert bounced.position.x == pytest.approx(limit)
    assert bounced.velocity.x == pytest.approx(-3)
    assert bounced.position.y == pytest.approx(0)


def test_apply_wall_bounce__inward_velocity__is_kept() -> None:
    bounced = apply_wall_bounce(_square("s", 9.9, 0.4, -3.0))
    assert bounced.position.x == pytest.approx(9.9)
    assert bounced.velocity.x == pytest.approx(-3)


def test_apply_wall_bounce__still_inside__does_not_reverse() -> None:
    bounced = apply_wall_bounce(_square("s", 0.0, 0.4, 3.0))
    assert bounced.velocity.x == pytest.approx(3)
    assert bounced.position.x == pytest.approx(0)


def test_collision_indexes__exact_contact__does_not_remove() -> None:
    edge = 2 / math.sqrt(2)
    states = [_square("a", 0.0, edge), _square("b", 2.0, edge)]
    assert collision_indexes(states) == []


def test_removal_order__overlap__removes_both_indexes_once_and_keeps_the_third() -> None:
    edge = 2 / math.sqrt(2)
    states = [_square("a", 0.0, edge), _square("b", 1.9, edge), _square("c", 8.0, edge)]
    assert removal_order(states) == [1, 0]
    assert collision_indexes(states) == [0, 1]


def test_integrate_square__zero_delta__does_not_move_center() -> None:
    state = _square("s", 1.5, 1.0, 3.0)
    moved = integrate_square(state, 0.0)
    assert moved.position.x == pytest.approx(1.5)


def test_simulation_step__no_squares__is_a_no_op() -> None:
    simulation = BouncingSimulation(ScriptedRandom([]))  # type: ignore[arg-type]
    result = simulation.step(1.0)
    assert result.survivors == ()
    assert simulation.square_count == 0


def test_simulation_step__zero_delta__does_not_move_centers() -> None:
    state = _square("s", 1.0, 0.4, 3.0)
    simulation = BouncingSimulation(ScriptedRandom([]), squares=[state])  # type: ignore[arg-type]
    simulation.step(0.0)
    assert simulation.squares[0].position.x == pytest.approx(1.0)


def test_simulation_spawn_at__max_count__returns_none() -> None:
    simulation = BouncingSimulation(ScriptedRandom([0.5] * 8), max_squares=5)  # type: ignore[arg-type]
    simulation.set_max_squares(5)
    assert simulation.spawn_at(Vec3(0, 0, 0)) is not None
    simulation.set_max_squares(5)
    assert simulation.square_count == 1
    assert format_square_status(1, simulation.max_squares) == "Squares: 1 / 5"


def test_simulation_spawn_at__outside_bounds__returns_none() -> None:
    simulation = BouncingSimulation(ScriptedRandom([0.5] * 4))  # type: ignore[arg-type]
    assert simulation.spawn_at(Vec3(10.1, 0, 0)) is None
    assert simulation.square_count == 0


def test_simulation_set_max_squares__below_count__does_not_delete() -> None:
    simulation = BouncingSimulation(ScriptedRandom([0.5] * 8))  # type: ignore[arg-type]
    simulation.spawn_at(Vec3(0, 0, 0))
    simulation.spawn_at(Vec3(1, 0, 0))
    assert simulation.set_max_squares(5) == 5
    assert simulation.square_count == 2
