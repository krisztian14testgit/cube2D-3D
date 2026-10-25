"""Parity tests for the exploding-cube formulas."""

from __future__ import annotations

import math
import random

import pytest
from tests.fakes.renderers import ScriptedRandom

from grok_4_7.features.cubes_exploding.math import (
    CollisionSample,
    bounce_velocity,
    clamp_camera_rotation_speed,
    clamp_max_cubes,
    clamp_point_inside_sphere,
    collect_collision_indexes,
    cube_half_extent,
    distance3,
    dot3,
    random_cube_scale,
    random_diffuse_channel,
    random_diffuse_hex,
    random_rotation_speed,
    random_velocity,
    should_bounce_off_sphere,
    sort_indexes_descending,
    vector_length,
)
from grok_4_7.features.cubes_exploding.simulation import ExplodingCube, step_simulation
from grok_4_7.math_types import ORIGIN, Vec3


def test_clamp_max_cubes__non_finite__becomes_10() -> None:
    assert clamp_max_cubes(float("nan")) == 10
    assert clamp_max_cubes(float("inf")) == 10


def test_clamp_max_cubes__100_6__clamps_to_100() -> None:
    assert clamp_max_cubes(100.6) == 100


def test_clamp_max_cubes__half_up_and_floor__stays_in_range() -> None:
    assert clamp_max_cubes(10.5) == 11
    assert clamp_max_cubes(9) == 10
    assert clamp_max_cubes(50.2) == 50


def test_clamp_camera_rotation_speed__non_finite__uses_default() -> None:
    assert clamp_camera_rotation_speed(float("nan")) == pytest.approx(1.0)


def test_clamp_camera_rotation_speed__outside_range__clamps() -> None:
    assert clamp_camera_rotation_speed(0) == pytest.approx(0.1)
    assert clamp_camera_rotation_speed(9) == pytest.approx(5)
    assert clamp_camera_rotation_speed(2.5) == pytest.approx(2.5)


def test_random_cube_scale__scripted_rng__stays_in_closed_range() -> None:
    assert random_cube_scale(ScriptedRandom([0.0])) == pytest.approx(1.0)  # type: ignore[arg-type]
    assert random_cube_scale(ScriptedRandom([1.0])) == pytest.approx(5.0)  # type: ignore[arg-type]


def test_random_cube_scale__seeded_rng__always_in_range() -> None:
    rng = random.Random(1234)
    scales = [random_cube_scale(rng) for _ in range(40)]
    assert min(scales) >= 1
    assert max(scales) <= 5


def test_random_velocity__zero_draw__is_negative_magnitude() -> None:
    velocity = random_velocity(ScriptedRandom([0.0, 0.0, 0.0]))  # type: ignore[arg-type]
    assert velocity == Vec3(-4.8, -4.8, -4.8)


def test_random_rotation_speed__one_draw__is_positive_magnitude() -> None:
    angular = random_rotation_speed(ScriptedRandom([1.0, 1.0, 1.0]))  # type: ignore[arg-type]
    assert angular == Vec3(2.4, 2.4, 2.4)


def test_random_diffuse_channel__bounds__match_js_formula() -> None:
    assert random_diffuse_channel(ScriptedRandom([0.0])) == pytest.approx(0.3)  # type: ignore[arg-type]
    assert random_diffuse_channel(ScriptedRandom([1.0])) == pytest.approx(1.0)  # type: ignore[arg-type]


def test_random_diffuse_hex__scripted__is_hash_rgb() -> None:
    color = random_diffuse_hex(ScriptedRandom([0.0, 0.0, 0.0]))  # type: ignore[arg-type]
    assert color == "#4c4c4c"


def test_cube_half_extent__unit_edge__is_space_diagonal() -> None:
    assert cube_half_extent(2) == pytest.approx(math.sqrt(3))


def test_distance_dot_and_length__known_vectors__match_geometry() -> None:
    assert distance3(Vec3(0, 0, 0), Vec3(3, 4, 0)) == pytest.approx(5)
    assert vector_length(Vec3(3, 4, 0)) == pytest.approx(5)
    assert dot3(Vec3(1, 0, 0), Vec3(-2, 5, 0)) == pytest.approx(-2)


def test_collect_collision_indexes__exact_contact__does_not_collide() -> None:
    cubes = [
        CollisionSample(ORIGIN, 1.0),
        CollisionSample(Vec3(2, 0, 0), 1.0),
    ]
    assert collect_collision_indexes(cubes) == []


def test_collect_collision_indexes__overlap__returns_each_index_once() -> None:
    cubes = [
        CollisionSample(ORIGIN, 1.0),
        CollisionSample(Vec3(1, 0, 0), 1.0),
        CollisionSample(Vec3(10, 0, 0), 1.0),
    ]
    assert collect_collision_indexes(cubes) == [0, 1]


def test_collect_collision_indexes__shared_partner__does_not_duplicate() -> None:
    cubes = [
        CollisionSample(ORIGIN, 1.0),
        CollisionSample(Vec3(0.5, 0, 0), 1.0),
        CollisionSample(Vec3(-0.5, 0, 0), 1.0),
    ]
    assert collect_collision_indexes(cubes) == [0, 1, 2]


def test_sort_indexes_descending__does_not_mutate_input() -> None:
    indexes = [1, 4, 2]
    assert sort_indexes_descending(indexes) == [4, 2, 1]
    assert indexes == [1, 4, 2]


@pytest.mark.parametrize(
    ("position", "velocity", "expected"),
    [
        (Vec3(10, 0, 0), Vec3(1, 0, 0), True),
        (Vec3(10, 0, 0), Vec3(-1, 0, 0), False),
        (Vec3(1, 0, 0), Vec3(1, 0, 0), False),
        (Vec3(7, 0, 0), Vec3(1, 0, 0), False),
    ],
)
def test_should_bounce_off_sphere__position_and_direction__matches_predicate(
    position: Vec3,
    velocity: Vec3,
    expected: bool,
) -> None:
    assert should_bounce_off_sphere(position, velocity, 8, 1) is expected


def test_bounce_velocity__negative_zero__becomes_positive_zero() -> None:
    result = bounce_velocity(Vec3(0.0, -1.0, 2.0))
    assert math.copysign(1.0, result.x) == 1.0
    assert result.y == pytest.approx(1.0)
    assert result.z == pytest.approx(-2.0)


def test_clamp_point_inside_sphere__outside__shrinks_to_margin() -> None:
    clamped = clamp_point_inside_sphere(Vec3(10, 0, 0), 8, 1)
    assert clamped.length() == pytest.approx((8 - 1) * 0.85)


def test_clamp_point_inside_sphere__already_inside__keeps_point() -> None:
    point = Vec3(0.2, -0.1, 0.3)
    assert clamp_point_inside_sphere(point, 8, 1) == point


def test_step_simulation__one_sixtieth__matches_one_js_frame() -> None:
    cube = ExplodingCube("c", ORIGIN, Vec3(4.8, -2.4, 1.2), ORIGIN, Vec3(2.4, 0, 0), 1, 0.1, "#ffffff")
    moved = step_simulation([cube], 1 / 60, 100).survivors[0]
    assert moved.position.x == pytest.approx(0.08)
    assert moved.position.y == pytest.approx(-0.04)
    assert moved.position.z == pytest.approx(0.02)
    assert moved.orientation_radians.x == pytest.approx(0.04)
    assert moved.orientation_radians.y == pytest.approx(0)
    assert moved.orientation_radians.z == pytest.approx(0)


def test_step_simulation__empty__does_no_work() -> None:
    assert step_simulation([], 1, 8).survivors == ()


def test_step_simulation__outside_and_outward__negates_velocity_only() -> None:
    cube = ExplodingCube("c", Vec3(10, 0, 0), Vec3(1, 0, 0), ORIGIN, ORIGIN, 1, 1, "#ffffff")
    moved = step_simulation([cube], 0.0, 8).survivors[0]
    assert moved.position.x == pytest.approx(10)
    assert moved.velocity.x == pytest.approx(-1)
