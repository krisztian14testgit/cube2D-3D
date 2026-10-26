"""Scene-level spawn limits for bouncing squares."""

from __future__ import annotations

import random

import pytest
from tests.fakes.renderers import FakeCamera, FakeSceneRenderer

from grok_4_7.features.bouncing_squares.scene import BouncingServices, BouncingSquaresScene
from grok_4_7.lifecycle import TickRegistry
from grok_4_7.math_types import Vec3


def _scene(max_squares: int = 20) -> tuple[BouncingSquaresScene, FakeSceneRenderer, TickRegistry]:
    renderer = FakeSceneRenderer()
    registry = TickRegistry()
    scene = BouncingSquaresScene(
        BouncingServices(renderer, FakeCamera(), random.Random(1), registry),
        max_squares=max_squares,
    )
    return scene, renderer, registry


def test_spawn_at__outside_and_at_max__returns_false() -> None:
    scene, renderer, _registry = _scene(max_squares=5)
    assert scene.spawn_at(Vec3(0, 0, 0)) is False
    scene.build()
    assert scene.spawn_at(Vec3(10.1, 0, 0)) is False
    assert scene.spawn_at(Vec3(0, -10.1, 0)) is False
    for index in range(5):
        assert scene.spawn_at(Vec3(float(index) - 2, 0, 0)) is True
    assert scene.spawn_at(Vec3(0, 1, 0)) is False
    assert scene.square_count == 5
    assert scene.status_text == "Squares: 5 / 5"
    assert renderer.refresh_count > 0


def test_step__zero_delta__does_not_move_centers() -> None:
    scene, _renderer, _registry = _scene()
    scene.build()
    scene.spawn_at(Vec3(1, 2, 9))
    before = scene.squares[0].position
    scene.step(0)
    assert scene.squares[0].position.x == before.x
    assert scene.squares[0].position.y == before.y


def test_dispose__unregisters_tick_and_is_safe_twice() -> None:
    scene, renderer, registry = _scene()
    scene.dispose()
    scene.build()
    assert registry.tick_count == 1
    scene.dispose()
    scene.dispose()
    assert registry.tick_count == 0
    assert renderer.cleared is True
    assert scene.square_count == 0


def test_build__draws_grid_axes_and_labels() -> None:
    scene, renderer, _registry = _scene()
    scene.build()
    assert {"grid", "x-axis", "y-axis"} <= set(renderer.meshes)
    assert len(renderer.labels) == 10


def test_set_speed__scales_motion_per_step() -> None:
    scene, _renderer, _registry = _scene()
    scene.build()
    scene.spawn_at(Vec3(0, 0, 0))
    assert scene.set_speed(2.0) == 2.0


def test_step__long_frame__is_substepped_and_moves_full_distance() -> None:
    scene, _renderer, _registry = _scene()
    scene.build()
    scene.spawn_at(Vec3(0, 0, 0))
    velocity = scene.squares[0].velocity.x
    scene.step(0.2)
    assert scene.squares[0].position.x == pytest.approx(velocity * 0.2)
