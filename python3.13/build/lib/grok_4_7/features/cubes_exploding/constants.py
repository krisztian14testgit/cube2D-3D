"""Numeric contract for exploding cubes. Speeds are per second, not per frame."""

from typing import Final

DEFAULT_SPHERE_SCALE: Final = 8.0
MIN_SPHERE_SCALE: Final = 4.0
MAX_SPHERE_SCALE: Final = 20.0
SPHERE_SCALE_STEP: Final = 0.5
DEFAULT_MAX_CUBES: Final = 10
MIN_MAX_CUBES: Final = 10
MAX_MAX_CUBES: Final = 100
MIN_CUBE_SCALE: Final = 1.0
MAX_CUBE_SCALE: Final = 5.0
DEFAULT_CAMERA_ROTATION_SPEED: Final = 1.0
MIN_CAMERA_ROTATION_SPEED: Final = 0.1
MAX_CAMERA_ROTATION_SPEED: Final = 5.0
# JavaScript used 0.08 world-units per frame. One frame is 1/60 s.
LINEAR_SPEED: Final = 4.8
# JavaScript used 0.04 rad per frame.
ANGULAR_SPEED: Final = 2.4
SPAWN_SHRINK: Final = 0.85
SPHERE_SEGMENTS: Final = 32
SPHERE_OPACITY: Final = 0.15
SPHERE_COLOR: Final = "#3399ff"
BACKGROUND: Final[tuple[float, float, float]] = (0.12, 0.12, 0.16)
BURST_POINT_COUNT: Final = 80
BURST_MIN_LIFE_SECONDS: Final = 0.15
BURST_MAX_LIFE_SECONDS: Final = 0.45
BURST_DISPOSE_SECONDS: Final = 0.45
CAMERA_LOWER_RADIUS: Final = 4.0
CAMERA_UPPER_FLOOR: Final = 40.0
CAMERA_UPPER_FACTOR: Final = 6.0
INITIAL_CAMERA_ALPHA: Final = 0.7853981633974483
INITIAL_CAMERA_BETA: Final = 1.0471975511965976
DIFFUSE_FLOOR: Final = 0.3
DIFFUSE_SPAN: Final = 0.7
