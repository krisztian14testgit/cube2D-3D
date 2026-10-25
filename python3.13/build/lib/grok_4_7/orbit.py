"""Spherical camera placement matching a Babylon arc-rotate camera."""

from __future__ import annotations

import math

from grok_4_7.math_types import Vec3


def orbit_position(alpha_radians: float, beta_radians: float, radius: float) -> Vec3:
    """Return the camera position for yaw ``alpha`` and polar ``beta``.

    Babylon's arc-rotate formula keeps ``+Y`` up. ``beta`` is measured from
    ``+Y``, so ``pi/2`` looks from the horizontal plane.
    """
    horizontal = radius * math.sin(beta_radians)
    return Vec3(
        horizontal * math.cos(alpha_radians),
        radius * math.cos(beta_radians),
        horizontal * math.sin(alpha_radians),
    )


def clamp_orbit_radius(position: Vec3, focal: Vec3, lower: float, upper: float) -> Vec3:
    """Keep the camera on the same ray, inside ``[lower, upper]``.

    A zero-length offset is pushed to ``lower`` along +Z so wheel zoom cannot
    collapse the camera onto the target.
    """
    offset = position.subtracted(focal)
    length = offset.length()
    if length == 0.0:
        return focal.added(Vec3(0.0, 0.0, lower))
    clamped = min(upper, max(lower, length))
    if clamped == length:
        return position
    return focal.added(offset.scaled(clamped / length))
