"""Exploding-cube scene. Motion is per second; the sphere scale does not pull cubes back."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass

from grok_4_7.features.cubes_exploding.constants import (
    BACKGROUND,
    CAMERA_LOWER_RADIUS,
    DEFAULT_CAMERA_ROTATION_SPEED,
    DEFAULT_MAX_CUBES,
    DEFAULT_SPHERE_SCALE,
    SPHERE_COLOR,
    SPHERE_OPACITY,
)
from grok_4_7.features.cubes_exploding.effects import BurstBook
from grok_4_7.features.cubes_exploding.geometry import build_boundary_sphere, build_unit_cube
from grok_4_7.features.cubes_exploding.math import (
    camera_upper_radius,
    clamp_camera_rotation_speed,
    clamp_max_cubes,
    clamp_point_inside_sphere,
    cube_half_extent,
    format_cube_status,
    random_cube_scale,
    random_diffuse_hex,
    random_rotation_speed,
    random_velocity,
)
from grok_4_7.features.cubes_exploding.simulation import ExplodingCube, step_simulation
from grok_4_7.math_types import ORIGIN, Vec3
from grok_4_7.numbers import is_finite_number
from grok_4_7.ports import (
    CameraController,
    ExplosionEffect,
    LifecyclePort,
    MeshDisplay,
    OrbitView,
    SceneRenderer,
    Transform,
    ViewPicker,
)

_SPHERE_NAME = "boundary-sphere"


@dataclass(frozen=True, slots=True)
class ExplodingServices:
    """Collaborators for the exploding scene. Grouped to keep the constructor small."""

    renderer: SceneRenderer
    camera: CameraController
    picker: ViewPicker
    effects: ExplosionEffect
    lifecycle: LifecyclePort
    rng: random.Random


class ExplodingScene:
    """Spawns cubes inside the sphere and removes colliding pairs with a burst."""

    def __init__(
        self,
        services: ExplodingServices,
        sphere_scale: float = DEFAULT_SPHERE_SCALE,
        max_cubes: int = DEFAULT_MAX_CUBES,
    ) -> None:
        self._services = services
        self._sphere_radius = sphere_scale
        self._max_cubes = clamp_max_cubes(max_cubes)
        self._camera_speed = DEFAULT_CAMERA_ROTATION_SPEED
        self._cubes: list[ExplodingCube] = []
        self._next_id = 1
        self._unit_cube = build_unit_cube()
        self._is_built = False

    @property
    def cube_count(self) -> int:
        """Cubes still in the sphere."""
        return len(self._cubes)

    @property
    def max_cubes(self) -> int:
        """Spawn cap. Lowering it does not delete cubes."""
        return self._max_cubes

    @property
    def sphere_scale(self) -> float:
        """Sphere radius. The mesh is a unit sphere scaled by this value."""
        return self._sphere_radius

    @property
    def camera_rotation_speed(self) -> float:
        """Right-drag orbit sensitivity."""
        return self._camera_speed

    @property
    def status_text(self) -> str:
        """Status line ``Cubes: {count} / {max}``."""
        return format_cube_status(self.cube_count, self.max_cubes)

    @property
    def cubes(self) -> tuple[ExplodingCube, ...]:
        """Current cubes."""
        return tuple(self._cubes)

    def build(self) -> None:
        """Draw the sphere and register the frame callback. A second call is ignored."""
        if self._is_built:
            return
        self._services.renderer.set_background(BACKGROUND)
        self._services.renderer.add_mesh(build_boundary_sphere(), self._sphere_display())
        self._services.renderer.set_transform(_SPHERE_NAME, Transform(ORIGIN, ORIGIN, self._sphere_radius))
        self._services.camera.show_orbit(self._orbit_view())
        self._services.camera.set_orbit_speed(self._camera_speed)
        self._services.lifecycle.register_tick(self.step)
        self._is_built = True
        self._services.renderer.refresh()

    def spawn_at(self, point: Vec3) -> bool:
        """Spawn one cube at a clamped point. Returns ``False`` at the cap or before build."""
        if not self._is_built or self.cube_count >= self._max_cubes:
            return False
        cube = self._new_cube(point)
        self._cubes.append(cube)
        self._draw(cube)
        self._services.renderer.refresh()
        return True

    def try_spawn_at_screen(self, x_px: float, y_px: float) -> bool:
        """Pick the sphere and spawn. A miss or a full cap spawns nothing."""
        if not self._is_built:
            return False
        point = self._services.picker.pick_sphere(x_px, y_px)
        if point is None:
            return False
        return self.spawn_at(point)

    def set_sphere_scale(self, scale: float) -> None:
        """Update the radius. Non-finite or non-positive values leave state unchanged."""
        if not is_finite_number(scale) or float(scale) <= 0:
            return
        self._sphere_radius = float(scale)
        if not self._is_built:
            return
        self._services.renderer.set_transform(_SPHERE_NAME, Transform(ORIGIN, ORIGIN, self._sphere_radius))
        self._services.camera.set_radius_limits(CAMERA_LOWER_RADIUS, camera_upper_radius(self._sphere_radius))
        self._services.renderer.refresh()

    def set_max_cubes(self, value: float) -> int:
        """Clamp the cap. Existing cubes are kept even when the cap drops below the count."""
        self._max_cubes = clamp_max_cubes(value)
        return self._max_cubes

    def set_camera_rotation_speed(self, value: float) -> float:
        """Clamp and store orbit sensitivity."""
        self._camera_speed = clamp_camera_rotation_speed(value)
        self._services.camera.set_orbit_speed(self._camera_speed)
        return self._camera_speed

    def step(self, delta_seconds: float) -> None:
        """Integrate, bounce, then explode every colliding cube once."""
        if not self._is_built or not self._cubes:
            return
        result = step_simulation(self._cubes, delta_seconds, self._sphere_radius)
        self._explode(result.removed)
        self._cubes = list(result.survivors)
        for cube in self._cubes:
            self._services.renderer.set_transform(cube.name, _cube_transform(cube))
        self._services.effects.step(delta_seconds)
        self._services.renderer.refresh()

    def dispose(self) -> None:
        """Cancel bursts, drop meshes, and unregister the tick. Safe before init and twice."""
        self._services.lifecycle.unregister(self.step)
        self._services.effects.dispose()
        self._services.renderer.clear()
        self._cubes.clear()
        self._is_built = False

    def _new_cube(self, point: Vec3) -> ExplodingCube:
        edge = random_cube_scale(self._services.rng)
        half_extent = cube_half_extent(edge)
        position = clamp_point_inside_sphere(point, self._sphere_radius, half_extent)
        name = f"exploding-cube-{self._next_id}"
        self._next_id += 1
        return ExplodingCube(
            name,
            position,
            random_velocity(self._services.rng),
            ORIGIN,
            random_rotation_speed(self._services.rng),
            edge,
            half_extent,
            random_diffuse_hex(self._services.rng),
        )

    def _draw(self, cube: ExplodingCube) -> None:
        self._services.renderer.add_mesh(self._unit_cube, MeshDisplay(cube.name, cube.color))
        self._services.renderer.set_transform(cube.name, _cube_transform(cube))

    def _explode(self, removed: tuple[ExplodingCube, ...]) -> None:
        for cube in removed:
            self._services.effects.spawn_burst(cube.position)
            self._services.renderer.remove(cube.name)

    def _sphere_display(self) -> MeshDisplay:
        return MeshDisplay(_SPHERE_NAME, SPHERE_COLOR, style="wireframe", opacity=SPHERE_OPACITY, pickable=True)

    def _orbit_view(self) -> OrbitView:
        return OrbitView(
            math.pi / 4,
            math.pi / 3,
            self._sphere_radius * 3,
            ORIGIN,
            CAMERA_LOWER_RADIUS,
            camera_upper_radius(self._sphere_radius),
        )


def _cube_transform(cube: ExplodingCube) -> Transform:
    return Transform(cube.position, cube.orientation_radians, cube.edge_length)


def make_burst_book(rng: random.Random) -> BurstBook:
    """Build the default effect implementation."""
    return BurstBook(rng)
