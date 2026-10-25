"""Ports. Feature scenes depend on these, not on a plotter or a trame server."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

import pyvista as pv

from grok_4_7.math_types import Vec3
from grok_4_7.picking import Ray


@dataclass(frozen=True, slots=True)
class MeshDisplay:
    """How a named mesh should be drawn."""

    name: str
    color: str
    style: str = "surface"
    opacity: float = 1.0
    pickable: bool = False


@dataclass(frozen=True, slots=True)
class Transform:
    """Rigid transform plus uniform scale. Orientation is radians."""

    position: Vec3
    orientation_radians: Vec3
    scale: float


@dataclass(frozen=True, slots=True)
class OrthographicView:
    """Orthographic camera aimed at the XY plane."""

    position: Vec3
    focal_point: Vec3
    view_up: Vec3
    parallel_scale: float = 12.0


@dataclass(frozen=True, slots=True)
class OrbitView:
    """Orbit camera. Angles match a Babylon arc-rotate camera."""

    alpha_radians: float
    beta_radians: float
    radius: float
    target: Vec3
    lower_radius: float
    upper_radius: float


class SceneRenderer(Protocol):
    """Draws named meshes and can move them without rebuilding geometry."""

    def add_mesh(self, mesh: pv.PolyData, display: MeshDisplay) -> None:
        """Add or replace ``display.name``."""

    def remove(self, name: str) -> None:
        """Remove one named actor. Missing names are ignored."""

    def clear(self) -> None:
        """Remove every actor this renderer owns."""

    def set_transform(self, name: str, transform: Transform) -> None:
        """Move, rotate, and scale an existing actor."""

    def set_color(self, name: str, color: str) -> None:
        """Recolor an existing actor. Missing names are ignored."""

    def set_background(self, color: tuple[float, float, float]) -> None:
        """Set the view background."""

    def add_label(self, text: str, position: Vec3, *, name: str) -> None:
        """Place a text label at ``position``."""

    def refresh(self) -> None:
        """Redraw the view."""

    def contains(self, name: str) -> bool:
        """Return whether ``name`` is currently drawn."""

    def close(self) -> None:
        """Release the underlying view. Safe to call twice."""


class CameraController(Protocol):
    """Camera placement and orbit sensitivity."""

    def show_orthographic(self, view: OrthographicView) -> None:
        """Frame the XY plane with parallel projection."""

    def show_orbit(self, view: OrbitView) -> None:
        """Place an orbit camera and store its radius limits."""

    def set_radius_limits(self, lower: float, upper: float) -> None:
        """Update zoom limits without moving the camera."""

    def set_orbit_speed(self, speed: float) -> None:
        """Set right-drag orbit sensitivity. This does not spin the scene."""


class ViewPicker(Protocol):
    """Pixel picks. ``None`` means the click missed the requested surface."""

    def pick_xy_plane(self, x_px: float, y_px: float) -> Vec3 | None:
        """Return the world point on ``z = 0``."""

    def pick_sphere(self, x_px: float, y_px: float) -> Vec3 | None:
        """Return the world point on the boundary sphere."""


class DisplayRaySource(Protocol):
    """Converts a pixel into a world ray. Implemented by the plotter adapter."""

    def ray_through_pixel(self, x_px: float, y_px: float) -> Ray | None:
        """Return the ray through a display pixel, or ``None`` if unavailable."""


class ExplosionEffect(Protocol):
    """Short-lived burst book. No VTK types cross this port."""

    def spawn_burst(self, position: Vec3) -> None:
        """Start one orange burst at ``position``."""

    def step(self, delta_seconds: float) -> None:
        """Age bursts and drop those that have expired."""

    def dispose(self) -> None:
        """Cancel every burst. Safe to call twice."""

    @property
    def active_count(self) -> int:
        """Number of bursts that have not been disposed."""


class LifecyclePort(Protocol):
    """Resize and per-frame registrations a scene can remove on dispose."""

    def register_resize(self, callback: Callable[[], None]) -> None:
        """Replace the resize callback."""

    def register_tick(self, callback: Callable[[float], None]) -> None:
        """Register a frame callback. The same callback is not added twice."""

    def unregister(self, callback: Callable[..., None]) -> None:
        """Remove a previously registered callback. Missing callbacks are ignored."""


class FrameTimer(Protocol):
    """One repeating timer. ``stop`` uses the handle created by ``start``."""

    def start(self, on_tick: Callable[[float], None]) -> None:
        """Start calling ``on_tick`` with elapsed seconds. Restarts if running."""

    def stop(self) -> None:
        """Stop the timer. Safe when it was never started."""

    @property
    def is_running(self) -> bool:
        """Whether ``start`` is currently active."""
