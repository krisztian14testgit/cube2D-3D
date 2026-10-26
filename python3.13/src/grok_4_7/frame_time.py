"""Frame-delta clamping so a stalled tab cannot tunnel through a boundary."""

from __future__ import annotations

import logging
import math
from typing import Final

logger = logging.getLogger(__name__)

MAX_DELTA_SECONDS: Final = 0.25
FRAME_SECONDS: Final = 1.0 / 60.0


def clamp_frame_delta(delta_seconds: float) -> float:
    """Return a non-negative delta no larger than ``MAX_DELTA_SECONDS``.

    The unclamped value is logged at debug and is never used as the step.
    """
    if not math.isfinite(delta_seconds) or delta_seconds <= 0:
        logger.debug("ignored frame delta %s", delta_seconds)
        return 0.0
    if delta_seconds > MAX_DELTA_SECONDS:
        logger.debug("unclamped frame delta %s", delta_seconds)
        return MAX_DELTA_SECONDS
    return delta_seconds
