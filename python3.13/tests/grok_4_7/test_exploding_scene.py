"""Exploding scene lifecycle, spawn limits, and burst requests."""

from __future__ import annotations

import random

import pytest
from tests.fakes.renderers import FakeCamera, FakeEffect, FakePicker, FakeSceneRenderer, ScriptedRandom

from grok_4_7.features.cubes_exploding.effects import BurstBook
from grok_4_7.features.cubes_exploding.math import format_cube_status
from grok_4_7.features.cubes_exploding.scene import ExplodingScene, ExplodingServices
from grok_4_7.features.cubes_exploding.simulation import ExplodingCube
from grok_4_7.lifecycle import TickRegistry
from grok_4_7.math_types import ORIGIN, Vec3


def _scene(
    renderer: FakeSceneRenderer | None = None,
    effects: FakeEffect | BurstBook | None = None,
    picker: FakePicker | None = None,
    rng: random.Random | None = None,
) -> ExplodingScene:
    return ExplodingScene(
        ExplodingServices(
            renderer or FakeSceneRenderer(),
            FakeCamera(),
            picker or FakePicker(),
            effects or FakeEffect(),
            TickRegistry(),
            rng or random.Random(1),
        )
    )


def _cube(name: str, x: float) -> ExplodingCube:
    return ExplodingCube(name, Vec3(x, 0, 0), ORIGIN, ORIGIN, ORIGIN, 1, 1, "#ffffff")


def test_spawn_at__before_build_and_at_max__returns_false() -> None:
    scene = _scene()
    assert scene.spawn_at(ORIGIN) is False
    scene.build()
    scene.set_max_cubes(10)
    scene._cubes = [_cube(str(index), float(index)) for index in range(10)]  # noqa: SLF001
    assert scene.spawn_at(ORIGIN) is False
    assert scene.cube_count == 10


def test_try_spawn_at_screen__miss__spawns_nothing() -> None:
    picker = FakePicker(sphere_point=None)
    scene = _scene(picker=picker)
    scene.build()
    assert scene.try_spawn_at_screen(3, 4) is False
    assert picker.sphere_calls == [(3, 4)]
    assert scene.cube_count == 0


def test_try_spawn_at_screen__hit__spawns_one() -> None:
    picker = FakePicker(sphere_point=Vec3(1, 0, 0))
    scene = _scene(picker=picker, rng=random.Random(2))
    scene.build()
    assert scene.try_spawn_at_screen(8, 9) is True
    assert scene.cube_count == 1
    assert scene.status_text == "Cubes: 1 / 10"


def test_set_sphere_scale__non_positive_or_nan__leaves_radius() -> None:
    camera = FakeCamera()
    scene = ExplodingScene(
        ExplodingServices(FakeSceneRenderer(), camera, FakePicker(), FakeEffect(), TickRegistry(), random.Random(0))
    )
    scene.build()
    scene.set_sphere_scale(0)
    scene.set_sphere_scale(float("nan"))
    assert scene.sphere_scale == pytest.approx(8)
    scene.set_sphere_scale(12)
    assert scene.sphere_scale == pytest.approx(12)
    assert camera.upper_radius == pytest.approx(72)


def test_set_sphere_scale_and_max__do_not_delete_or_pull_cubes() -> None:
    scene = _scene()
    scene.build()
    scene._cubes = [_cube("kept", 6)]  # noqa: SLF001
    scene.set_sphere_scale(4)
    scene.set_max_cubes(float("nan"))
    assert scene.cube_count == 1
    assert scene.cubes[0].position.x == pytest.approx(6)
    assert scene.max_cubes == 10


def test_step__collision__asks_for_one_burst_per_cube_descending() -> None:
    effects = FakeEffect()
    scene = _scene(effects=effects)
    scene.build()
    scene._cubes = [_cube("a", 0), _cube("b", 0.2), _cube("c", 20)]  # noqa: SLF001
    scene.step(0)
    assert [burst.x for burst in effects.positions] == pytest.approx([0.2, 0.0])
    assert scene.cube_count == 1
    assert scene.cubes[0].name == "c"
    assert effects.steps == [0]


def test_dispose__after_burst_and_before_init__cancels_and_does_not_raise() -> None:
    book = BurstBook(ScriptedRandom([0.0]))  # type: ignore[arg-type]
    book.spawn_burst(ORIGIN)
    scene = _scene(effects=book)
    scene.dispose()
    assert book.active_count == 0
    scene.dispose()


def test_spawn_at__seeded_scale__is_in_range_and_clamped() -> None:
    scene = _scene(rng=random.Random(1234))
    scene.build()
    assert scene.spawn_at(Vec3(100, 0, 0)) is True
    cube = scene.cubes[0]
    assert 1 <= cube.edge_length <= 5
    assert cube.position.length() < scene.sphere_scale
    assert format_cube_status(1, 10) == scene.status_text


def test_set_camera_rotation_speed__non_finite__returns_default() -> None:
    camera = FakeCamera()
    scene = ExplodingScene(
        ExplodingServices(FakeSceneRenderer(), camera, FakePicker(), FakeEffect(), TickRegistry(), random.Random(0))
    )
    assert scene.set_camera_rotation_speed(float("nan")) == pytest.approx(1)
    assert camera.orbit_speed == pytest.approx(1)


def test_build__registers_tick_and_second_build_is_ignored() -> None:
    registry = TickRegistry()
    renderer = FakeSceneRenderer()
    scene = ExplodingScene(
        ExplodingServices(renderer, FakeCamera(), FakePicker(), FakeEffect(), registry, random.Random(0))
    )
    scene.build()
    scene.build()
    assert registry.tick_count == 1
    assert renderer.contains("boundary-sphere")
