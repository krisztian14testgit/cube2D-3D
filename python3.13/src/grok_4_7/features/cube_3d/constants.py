"""Single-cube contract. Rotation speed is radians per second."""

from typing import Final

AXIS_LENGTH: Final = 4.0
X_AXIS_COLOR: Final = "#ff0000"
Y_AXIS_COLOR: Final = "#00ff00"
Z_AXIS_COLOR: Final = "#0000ff"
DEFAULT_AXIS: Final = "y"
MIN_ROTATION_SPEED: Final = 0.0
MAX_ROTATION_SPEED: Final = 6.0
ROTATION_STEP: Final = 0.1
DEFAULT_ROTATION_SPEED: Final = 1.0
MIN_SCALE: Final = 0.5
MAX_SCALE: Final = 3.0
SCALE_STEP: Final = 0.1
DEFAULT_SCALE: Final = 1.0
DEFAULT_COLOR: Final = "#87cefa"
CAMERA_ALPHA: Final = 0.7853981633974483
CAMERA_BETA: Final = 1.0471975511965976
CAMERA_RADIUS: Final = 12.0
CUBE_NAME: Final = "interactive-cube"
STATUS_CLICK: Final = "Click the view to create the cube."
STATUS_ACTIVE: Final = "Cube is active. Adjust transform and rotation controls."
AXES: Final[tuple[str, ...]] = ("x", "y", "z")
