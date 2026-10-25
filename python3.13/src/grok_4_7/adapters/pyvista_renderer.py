"""PyVista plotter adapter. Forwards calls and does not own simulation rules."""

from __future__ import annotations

import logging
import math

import pyvista as pv

from grok_4_7.math_types import Vec3
from grok_4_7.orbit import clamp_orbit_radius, orbit_position
from grok_4_7.ports import MeshDisplay, OrbitView, OrthographicView, Transform

logger = logging.getLogger(__name__)


class PyVistaRenderer:
    """Named-mesh renderer over one plotter."""

    def __init__(self, plotter: pv.Plotter) -> None:
        self._plotter = plotter
        self._closed = False

    def add_mesh(self, mesh: pv.PolyData, display: MeshDisplay) -> None:
        """Add a named mesh. A later add with the same name replaces it."""
        if self.contains(display.name):
            self.remove(display.name)
        self._plotter.add_mesh(
            mesh,
            name=display.name,
            color=display.color,
            style=display.style,
            opacity=display.opacity,
            pickable=display.pickable,
        )

    def remove(self, name: str) -> None:
        """Remove one actor. A missing name is ignored."""
        if self.contains(name):
            self._plotter.remove_actor(name)

    def clear(self) -> None:
        """Remove actors without closing the plotter."""
        self._plotter.clear_actors()

    def set_transform(self, name: str, transform: Transform) -> None:
        """Apply position, radian orientation, and uniform scale."""
        actor = self._actor(name)
        if actor is None:
            logger.debug("missing actor %s", name)
            return
        actor.position = (transform.position.x, transform.position.y, transform.position.z)
        actor.orientation = _degrees(transform.orientation_radians)
        actor.scale = (transform.scale, transform.scale, transform.scale)

    def set_color(self, name: str, color: str) -> None:
        """Recolor an actor when the plotter exposes a property."""
        actor = self._actor(name)
        if actor is None:
            return
        prop = getattr(actor, "prop", None)
        if prop is not None:
            prop.color = color
            return
        if hasattr(actor, "set_color"):
            actor.set_color(color)

    def set_background(self, color: tuple[float, float, float]) -> None:
        """Set the plotter background."""
        self._plotter.set_background(color)

    def add_label(self, text: str, position: Vec3, *, name: str) -> None:
        """Add one point label."""
        self._plotter.add_point_labels(
            [(position.x, position.y, position.z)],
            [text],
            name=name,
            show_points=False,
            font_size=12,
        )

    def refresh(self) -> None:
        """Render the plotter."""
        self._plotter.render()

    def contains(self, name: str) -> bool:
        """Return whether the plotter still has this actor name."""
        try:
            return name in self._plotter.actors
        except TypeError:
            return False

    def close(self) -> None:
        """Close the plotter. A second call is a no-op."""
        if self._closed:
            return
        self._closed = True
        self._plotter.close()

    def _actor(self, name: str) -> object | None:
        if not self.contains(name):
            return None
        return self._plotter.actors[name]


class PyVistaCamera:
    """Camera adapter. Orbit speed is drag sensitivity, not an animation."""

    def __init__(self, plotter: pv.Plotter) -> None:
        self._plotter = plotter
        self._orbit_speed = 1.0
        self._lower_radius: float | None = None
        self._upper_radius: float | None = None

    @property
    def orbit_speed(self) -> float:
        """Last sensitivity written to the interactor, if any."""
        return self._orbit_speed

    @property
    def lower_radius(self) -> float | None:
        """Last lower zoom limit passed to ``set_radius_limits``."""
        return self._lower_radius

    @property
    def upper_radius(self) -> float | None:
        """Last upper zoom limit passed to ``set_radius_limits``."""
        return self._upper_radius

    def show_orthographic(self, view: OrthographicView) -> None:
        """Aim an orthographic camera and set the parallel scale."""
        self._look_at(view.position, view.focal_point, view.view_up)
        self._plotter.enable_parallel_projection()
        self._plotter.camera.parallel_scale = view.parallel_scale

    def show_orbit(self, view: OrbitView) -> None:
        """Place the camera on the Babylon arc-rotate sphere."""
        position = orbit_position(view.alpha_radians, view.beta_radians, view.radius)
        self._look_at(position, view.target, Vec3(0.0, 1.0, 0.0))
        self._disable_parallel()
        self.set_radius_limits(view.lower_radius, view.upper_radius)

    def set_radius_limits(self, lower: float, upper: float) -> None:
        """Remember zoom limits. VTK has no Babylon radius, so they live here."""
        self._lower_radius = lower
        self._upper_radius = upper
        camera = self._plotter.camera
        if hasattr(camera, "clipping_range"):
            camera.clipping_range = (max(0.01, lower / 10), max(upper * 4, 1.0))
        _clamp_plotter_camera(camera, lower, upper)
        style = _style(self._plotter)
        if style is not None and hasattr(style, "set_radius_limits"):
            style.set_radius_limits(lower, upper)

    def set_orbit_speed(self, speed: float) -> None:
        """Store sensitivity and copy it onto the interactor style when present."""
        self._orbit_speed = speed
        style = _style(self._plotter)
        if style is not None and hasattr(style, "MotionFactor"):
            style.MotionFactor = speed

    def _look_at(self, position: Vec3, focal: Vec3, view_up: Vec3) -> None:
        self._plotter.camera_position = [
            (position.x, position.y, position.z),
            (focal.x, focal.y, focal.z),
            (view_up.x, view_up.y, view_up.z),
        ]

    def _disable_parallel(self) -> None:
        if hasattr(self._plotter, "disable_parallel_projection"):
            self._plotter.disable_parallel_projection()
            return
        self._plotter.camera.parallel_projection = False


def _clamp_plotter_camera(camera: object, lower: float, upper: float) -> None:
    position = getattr(camera, "position", None)
    focal = getattr(camera, "focal_point", None)
    if position is None or focal is None:
        return
    clamped = clamp_orbit_radius(Vec3(*position), Vec3(*focal), lower, upper)
    camera.position = (clamped.x, clamped.y, clamped.z)


def _degrees(orientation: Vec3) -> tuple[float, float, float]:
    return (math.degrees(orientation.x), math.degrees(orientation.y), math.degrees(orientation.z))


def _style(plotter: pv.Plotter) -> object | None:
    iren = getattr(plotter, "iren", None)
    if iren is None:
        return None
    return getattr(iren, "style", None)
