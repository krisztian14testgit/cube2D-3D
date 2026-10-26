"""Coordinate-system and single-cube scene behavior."""

from __future__ import annotations

import math

import pytest
from tests.fakes.renderers import FakeCamera, FakeSceneRenderer

from grok_4_7.errors import InvalidAxisError, InvalidColorError
from grok_4_7.features.coordinate_system.geometry import (
    axis_label_anchors,
    build_axis_line,
    build_grid,
    build_square,
    logical_to_world,
)
from grok_4_7.features.coordinate_system.scene import CoordinateScene
from grok_4_7.features.cube_3d.constants import CUBE_NAME, STATUS_ACTIVE, STATUS_CLICK
from grok_4_7.features.cube_3d.geometry import add_axis_rotation, axis_color, build_colored_axis, build_cube
from grok_4_7.features.cube_3d.scene import CubeScene
from grok_4_7.lifecycle import TickRegistry
from grok_4_7.math_types import ORIGIN, Vec3


def test_logical_to_world__xy__keeps_y_up_on_z0() -> None:
    assert logical_to_world(1, 2) == Vec3(1, 2, 0)


def test_build_grid__bounds__cover_the_contract_extent() -> None:
    bounds = build_grid().bounds
    assert bounds[0:2] == pytest.approx((-10, 10))
    assert bounds[2:4] == pytest.approx((-10, 10))
    assert bounds[4:6] == pytest.approx((0, 0))


def test_build_square__unit_edge__is_centered() -> None:
    assert build_square().bounds == pytest.approx((-0.5, 0.5, -0.5, 0.5, 0, 0))


def test_axis_label_anchors__include_contract_ticks() -> None:
    labels = dict(axis_label_anchors("x"))
    assert labels["10"].x == pytest.approx(10)
    assert labels["-5"].x == pytest.approx(-5)


def test_coordinate_scene__scale_bounds__accepts_ends_and_rejects_outside() -> None:
    scene = CoordinateScene(FakeSceneRenderer(), FakeCamera())
    scene.build()
    scene.set_square_scale(0.5)
    scene.set_square_scale(3)
    assert scene.square_scale == pytest.approx(3)
    with pytest.raises(ValueError, match="0.5"):
        scene.set_square_scale(0.49)
    with pytest.raises(ValueError, match="0.5"):
        scene.set_square_scale(3.01)
    with pytest.raises(ValueError, match="0.5"):
        scene.set_square_scale(float("nan"))


def test_coordinate_scene__dispose_before_build__is_safe() -> None:
    renderer = FakeSceneRenderer()
    scene = CoordinateScene(renderer, FakeCamera())
    scene.dispose()
    scene.dispose()
    assert renderer.cleared is True


def test_coordinate_scene__build__uses_two_axis_colors_and_orthographic_camera() -> None:
    renderer = FakeSceneRenderer()
    camera = FakeCamera()
    scene = CoordinateScene(renderer, camera)
    scene.build()
    scene.build()
    assert renderer.meshes["x-axis"].display.color == "#ff0000"
    assert renderer.meshes["y-axis"].display.color == "#00ff00"
    assert "z-axis" not in renderer.meshes
    assert camera.orthographic is not None
    assert camera.orthographic.position == Vec3(0, 0, 30)
    assert camera.orthographic.view_up == Vec3(0, 1, 0)
    assert renderer.background == pytest.approx((0.97, 0.97, 0.97))
    assert len(renderer.labels) == 10
    assert renderer.meshes["square"].transform is not None
    assert renderer.meshes["square"].transform.scale == pytest.approx(1)


def test_coordinate_scene__step__does_not_move_the_square() -> None:
    renderer = FakeSceneRenderer()
    scene = CoordinateScene(renderer, FakeCamera())
    scene.build()
    scene.step(1.0)
    assert renderer.meshes["square"].transform.position == Vec3(5.0, 5.0, 0.0)  # type: ignore[union-attr]


def test_build_axis_line__unknown_axis__raises() -> None:
    with pytest.raises(ValueError, match="axis"):
        build_axis_line("w", 1)


def test_cube_axes__three_distinct_colors() -> None:
    assert axis_color("x") == "#ff0000"
    assert axis_color("y") == "#00ff00"
    assert axis_color("z") == "#0000ff"
    with pytest.raises(ValueError, match="axis"):
        axis_color("w")
    assert build_colored_axis("z").bounds[4] == pytest.approx(-4)
    assert build_cube().bounds[1] == pytest.approx(0.5)


def test_add_axis_rotation__selected_axis_only() -> None:
    rotated = add_axis_rotation(Vec3(1, 2, 3), "x", 0.5)
    assert rotated == Vec3(1.5, 2, 3)


def test_cube_scene__second_create_and_scale_before_create__do_not_create() -> None:
    renderer = FakeSceneRenderer()
    scene = CubeScene(renderer, FakeCamera(), TickRegistry())
    assert scene.create_cube_if_missing() is False
    scene.build()
    assert scene.set_cube_scale(2) is False
    assert renderer.contains(CUBE_NAME) is False
    assert scene.create_cube_if_missing() is True
    assert scene.create_cube_if_missing() is False
    assert scene.status_text == STATUS_ACTIVE


def test_cube_scene__one_second_on_y__adds_one_radian_only() -> None:
    scene = CubeScene(FakeSceneRenderer(), FakeCamera(), TickRegistry())
    scene.build()
    scene.create_cube_if_missing()
    scene.set_rotation_axis("y")
    scene.set_rotation_speed(1)
    scene.step(1)
    assert scene.orientation_radians.y == pytest.approx(1)
    assert scene.orientation_radians.x == pytest.approx(0)
    assert scene.orientation_radians.z == pytest.approx(0)


def test_cube_scene__bad_axis_and_color__raise() -> None:
    scene = CubeScene(FakeSceneRenderer(), FakeCamera(), TickRegistry())
    with pytest.raises(InvalidAxisError, match="q"):
        scene.set_rotation_axis("q")
    with pytest.raises(InvalidColorError, match="blue"):
        scene.set_cube_color("blue")
    with pytest.raises(ValueError, match="rotation speed"):
        scene.set_rotation_speed(6.1)


def test_cube_scene__dispose__removes_resize_and_timer_registration() -> None:
    registry = TickRegistry()
    scene = CubeScene(FakeSceneRenderer(), FakeCamera(), registry)
    scene.dispose()
    scene.build()
    assert registry.resize_callback is not None
    assert registry.tick_count == 1
    scene.dispose()
    scene.dispose()
    assert registry.resize_callback is None
    assert registry.tick_count == 0
    assert scene.status_text == STATUS_CLICK


def test_cube_scene__orbit_camera__uses_contract_angles() -> None:
    camera = FakeCamera()
    scene = CubeScene(FakeSceneRenderer(), camera, TickRegistry())
    scene.build()
    assert camera.orbit is not None
    assert camera.orbit.alpha_radians == pytest.approx(math.pi / 4)
    assert camera.orbit.beta_radians == pytest.approx(math.pi / 3)
    assert camera.orbit.radius == pytest.approx(12)
    assert camera.orbit.target == ORIGIN


def test_cube_scene__scale_after_create__rejects_nan() -> None:
    scene = CubeScene(FakeSceneRenderer(), FakeCamera(), TickRegistry())
    scene.build()
    scene.create_cube_if_missing()
    with pytest.raises(ValueError, match="cube scale"):
        scene.set_cube_scale(float("nan"))


def test_cube_scene__resize_hook__refreshes() -> None:
    renderer = FakeSceneRenderer()
    registry = TickRegistry()
    scene = CubeScene(renderer, FakeCamera(), registry)
    scene.build()
    before = renderer.refresh_count
    registry.resize()
    assert renderer.refresh_count == before + 1
