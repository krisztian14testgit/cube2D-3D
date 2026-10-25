"""Frozen vectors used by every feature."""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Vec3:
    """Right-handed world point or vector. ``+Y`` is up and ``+Z`` faces the viewer."""

    x: float
    y: float
    z: float

    def length(self) -> float:
        """Return the Euclidean length."""
        return math.hypot(self.x, self.y, self.z)

    def dot(self, other: Vec3) -> float:
        """Return the dot product with ``other``."""
        return self.x * other.x + self.y * other.y + self.z * other.z

    def added(self, other: Vec3) -> Vec3:
        """Return the vector sum."""
        return Vec3(self.x + other.x, self.y + other.y, self.z + other.z)

    def scaled(self, factor: float) -> Vec3:
        """Return this vector multiplied by ``factor``."""
        return Vec3(self.x * factor, self.y * factor, self.z * factor)

    def subtracted(self, other: Vec3) -> Vec3:
        """Return ``self - other``."""
        return Vec3(self.x - other.x, self.y - other.y, self.z - other.z)


ORIGIN: Vec3 = Vec3(0.0, 0.0, 0.0)
