"""Visible labels. Tests and the layout share these so the copy cannot drift."""

from typing import Final

from grok_4_7 import __version__

AUTHOR_LINE: Final = "Created by Grok 4.7"
TOOLBAR_TITLE: Final = f"Grok 4.7 v{__version__}"
LABEL_COORD: Final = "Grok 4.7 — 2D-coord"
LABEL_CUBES: Final = "Grok 4.7 — 3D-cubes"
PAGE_COORD: Final = "coord_2d"
PAGE_CUBES: Final = "cubes_3d"
TITLE_COORD: Final = "Coordinate system"
TITLE_BOUNCE: Final = "Bouncing squares"
TITLE_CUBE: Final = "Single 3D cube"
TITLE_EXPLODING: Final = "Exploding cubes"
HELP_COORD: Final = "Use the scale slider to resize the square drawn at (5, 5)."
HELP_BOUNCE: Final = "Left-click inside the grid to spawn a square."
HELP_CUBE: Final = "Left-click the view to create the cube, then adjust its controls."
HELP_EXPLODING: Final = "Left-click the sphere to spawn a cube; right-drag to orbit."
DEFAULT_PORT: Final = 8080
