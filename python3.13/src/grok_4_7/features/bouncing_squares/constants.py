"""Bounds and ranges for bouncing squares. Speeds are per second."""

from typing import Final

HALF_EXTENT: Final = 10.0
MIN_EDGE: Final = 0.4
MAX_EDGE: Final = 1.6
MIN_MAX_SQUARES: Final = 5
MAX_MAX_SQUARES: Final = 40
DEFAULT_MAX_SQUARES: Final = 20
MIN_VELOCITY: Final = -3.0
MAX_VELOCITY: Final = 3.0
MIN_ANGULAR_SPEED: Final = -2.0
MAX_ANGULAR_SPEED: Final = 2.0
MIN_SPEED: Final = 0.25
MAX_SPEED: Final = 5.0
DEFAULT_SPEED: Final = 1.0
SPEED_STEP: Final = 0.25
MAX_SUBSTEP_SECONDS: Final = 0.02
SQUARE_COLOR: Final = "#87cefa"
BACKGROUND: Final[tuple[float, float, float]] = (0.97, 0.97, 0.97)
