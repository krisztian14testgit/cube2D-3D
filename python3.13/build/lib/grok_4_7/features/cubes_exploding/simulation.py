"""Time-based exploding-cube motion. No renderer imports."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, replace

from grok_4_7.features.cubes_exploding.math import (
    CollisionSample,
    bounce_velocity,
    collect_collision_indexes,
    should_bounce_off_sphere,
    sort_indexes_descending,
)
from grok_4_7.math_types import Vec3


@dataclass(frozen=True, slots=True)
class ExplodingCube:
    """One simulated cube. Velocity and angular velocity are per second."""

    name: str
    position: Vec3
    velocity: Vec3
    orientation_radians: Vec3
    angular_velocity: Vec3
    edge_length: float
    half_extent: float
    color: str


@dataclass(frozen=True, slots=True)
class StepResult:
    """Survivors keep their order. Removed cubes are highest index first."""

    survivors: tuple[ExplodingCube, ...]
    removed: tuple[ExplodingCube, ...]


def step_simulation(
    cubes: Sequence[ExplodingCube],
    delta_seconds: float,
    sphere_radius: float,
) -> StepResult:
    """Integrate one step. An empty collection does no work."""
    if not cubes:
        return StepResult((), ())
    moved = tuple(_advance(cube, delta_seconds, sphere_radius) for cube in cubes)
    removed_indexes = sort_indexes_descending(collect_collision_indexes(_samples(moved)))
    removed_set = set(removed_indexes)
    removed = tuple(moved[index] for index in removed_indexes)
    survivors = tuple(cube for index, cube in enumerate(moved) if index not in removed_set)
    return StepResult(survivors, removed)


def _advance(cube: ExplodingCube, delta_seconds: float, sphere_radius: float) -> ExplodingCube:
    position = cube.position.added(cube.velocity.scaled(delta_seconds))
    orientation = cube.orientation_radians.added(cube.angular_velocity.scaled(delta_seconds))
    velocity = cube.velocity
    if should_bounce_off_sphere(position, velocity, sphere_radius, cube.half_extent):
        velocity = bounce_velocity(velocity)
    return replace(cube, position=position, orientation_radians=orientation, velocity=velocity)


def _samples(cubes: Sequence[ExplodingCube]) -> list[CollisionSample]:
    return [CollisionSample(cube.position, cube.half_extent) for cube in cubes]
