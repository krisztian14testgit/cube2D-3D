"""Small numeric helpers shared by feature math."""

from __future__ import annotations

import math


def is_finite_number(value: float) -> bool:
    """Return whether ``value`` is a finite int or float and not a bool."""
    if isinstance(value, bool) or not isinstance(value, int | float):
        return False
    return math.isfinite(value)


def round_half_up(value: float) -> int:
    """Round half away from zero for positives, matching ``Math.round``."""
    return int(math.floor(float(value) + 0.5))
