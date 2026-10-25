"""Burst lifetimes. Points are data; this module does not create VTK objects."""

from __future__ import annotations

import random
from dataclasses import dataclass

from grok_4_7.features.cubes_exploding.constants import (
    BURST_DISPOSE_SECONDS,
    BURST_MAX_LIFE_SECONDS,
    BURST_MIN_LIFE_SECONDS,
    BURST_POINT_COUNT,
)
from grok_4_7.math_types import Vec3


@dataclass(frozen=True, slots=True)
class Burst:
    """One orange burst. The book disposes it after 0.45 seconds."""

    position: Vec3
    point_count: int
    life_seconds: float
    age_seconds: float


class BurstBook:
    """Records bursts and drops them after ``BURST_DISPOSE_SECONDS``."""

    def __init__(self, rng: random.Random) -> None:
        self._rng = rng
        self._bursts: list[Burst] = []

    @property
    def active_count(self) -> int:
        """Number of bursts still alive."""
        return len(self._bursts)

    @property
    def bursts(self) -> tuple[Burst, ...]:
        """Current bursts, oldest first."""
        return tuple(self._bursts)

    def spawn_burst(self, position: Vec3) -> None:
        """Start an 80-point burst whose particle life is in ``[0.15, 0.45)``."""
        life = BURST_MIN_LIFE_SECONDS + self._rng.random() * (BURST_MAX_LIFE_SECONDS - BURST_MIN_LIFE_SECONDS)
        self._bursts.append(
            Burst(position, BURST_POINT_COUNT, life, 0.0),
        )

    def step(self, delta_seconds: float) -> None:
        """Age every burst and drop those past the dispose deadline."""
        self._bursts = [burst for burst in self._aged(delta_seconds) if self._is_alive(burst)]

    def dispose(self) -> None:
        """Cancel every burst. A second call is a no-op."""
        self._bursts.clear()

    def _aged(self, delta_seconds: float) -> list[Burst]:
        return [
            Burst(burst.position, burst.point_count, burst.life_seconds, burst.age_seconds + delta_seconds)
            for burst in self._bursts
        ]

    def _is_alive(self, burst: Burst) -> bool:
        return burst.age_seconds < BURST_DISPOSE_SECONDS
