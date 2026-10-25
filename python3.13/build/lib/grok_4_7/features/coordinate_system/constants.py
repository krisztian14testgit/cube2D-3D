"""Coordinate-system contract. Logical ``(x, y)`` is world ``(x, y, 0)``."""

from typing import Final

HALF_EXTENT: Final = 10
TICK_STEP: Final = 1
LABEL_ANCHORS: Final[tuple[int, ...]] = (-10, -5, 0, 5, 10)
X_AXIS_COLOR: Final = "#ff0000"
Y_AXIS_COLOR: Final = "#00ff00"
GRID_COLOR: Final = "#9e9e9e"
BACKGROUND: Final[tuple[float, float, float]] = (0.97, 0.97, 0.97)
SQUARE_EDGE: Final = 1.0
SQUARE_COLOR: Final = "#87cefa"
MIN_SCALE: Final = 0.5
MAX_SCALE: Final = 3.0
DEFAULT_SCALE: Final = 1.0
SCALE_STEP: Final = 0.1
CAMERA_DISTANCE: Final = 30.0
PARALLEL_SCALE: Final = 12.0
SQUARE_NAME: Final = "square"
GRID_NAME: Final = "grid"
X_AXIS_NAME: Final = "x-axis"
Y_AXIS_NAME: Final = "y-axis"
