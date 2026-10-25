"""Vuetify layout fragments. Handlers are passed in; this module does no math."""

from __future__ import annotations

from collections.abc import Callable

from trame.widgets import html, vuetify3

from grok_4_7.features.bouncing_squares.constants import (
    DEFAULT_MAX_SQUARES,
    MAX_MAX_SQUARES,
    MIN_MAX_SQUARES,
)
from grok_4_7.features.coordinate_system.constants import (
    DEFAULT_SCALE,
    MAX_SCALE,
    MIN_SCALE,
    SCALE_STEP,
)
from grok_4_7.features.cube_3d.constants import (
    DEFAULT_COLOR,
    DEFAULT_ROTATION_SPEED,
    MAX_ROTATION_SPEED,
    MIN_ROTATION_SPEED,
    ROTATION_STEP,
)
from grok_4_7.features.cubes_exploding.constants import (
    DEFAULT_CAMERA_ROTATION_SPEED,
    DEFAULT_MAX_CUBES,
    DEFAULT_SPHERE_SCALE,
    MAX_CAMERA_ROTATION_SPEED,
    MAX_MAX_CUBES,
    MAX_SPHERE_SCALE,
    MIN_CAMERA_ROTATION_SPEED,
    MIN_MAX_CUBES,
    MIN_SPHERE_SCALE,
    SPHERE_SCALE_STEP,
)
from grok_4_7.pages.copy import (
    AUTHOR_LINE,
    HELP_BOUNCE,
    HELP_COORD,
    HELP_CUBE,
    HELP_EXPLODING,
    TITLE_BOUNCE,
    TITLE_COORD,
    TITLE_CUBE,
    TITLE_EXPLODING,
)

ViewFactory = Callable[[object], object]


def mount_coord_page(
    top_plotter: object,
    bottom_plotter: object,
    view_factory: ViewFactory,
) -> None:
    """Mount the coordinate page: grid, divider, then bouncing squares."""
    _author_and_section(TITLE_COORD, HELP_COORD)
    _view_and_controls(top_plotter, view_factory, _coord_controls, prevent_menu=False)
    vuetify3.VDivider(classes="my-4")
    _section(TITLE_BOUNCE, HELP_BOUNCE)
    _view_and_controls(bottom_plotter, view_factory, _bounce_controls, prevent_menu=False)


def mount_cubes_page(
    top_plotter: object,
    bottom_plotter: object,
    view_factory: ViewFactory,
) -> None:
    """Mount the 3D page: one cube, divider, then exploding cubes."""
    _author_and_section(TITLE_CUBE, HELP_CUBE)
    _view_and_controls(top_plotter, view_factory, _cube_controls, prevent_menu=True)
    vuetify3.VDivider(classes="my-4")
    _section(TITLE_EXPLODING, HELP_EXPLODING)
    _view_and_controls(bottom_plotter, view_factory, _exploding_controls, prevent_menu=True)


def _author_and_section(title: str, help_text: str) -> None:
    html.Div(AUTHOR_LINE, classes="text-caption mb-2")
    _section(title, help_text)


def _section(title: str, help_text: str) -> None:
    html.H2(title, classes="text-h5")
    html.P(help_text)


def _view_and_controls(
    plotter: object,
    view_factory: ViewFactory,
    controls: Callable[[], None],
    *,
    prevent_menu: bool,
) -> None:
    with vuetify3.VRow(classes="ma-0"):
        with vuetify3.VCol(cols=8):
            _view_box(plotter, view_factory, prevent_menu=prevent_menu)
        with vuetify3.VCol(cols=4):
            controls()


def _view_box(plotter: object, view_factory: ViewFactory, *, prevent_menu: bool) -> None:
    raw_attrs = ["@contextmenu.prevent"] if prevent_menu else None
    with html.Div(style="height: 420px;", raw_attrs=raw_attrs):
        view_factory(plotter)


def _coord_controls() -> None:
    vuetify3.VSlider(
        v_model=("coord_scale", DEFAULT_SCALE),
        min=MIN_SCALE,
        max=MAX_SCALE,
        step=SCALE_STEP,
        label="Scale",
        hide_details=True,
    )


def _bounce_controls() -> None:
    vuetify3.VSlider(
        v_model=("max_squares", DEFAULT_MAX_SQUARES),
        min=MIN_MAX_SQUARES,
        max=MAX_MAX_SQUARES,
        step=1,
        label="Max squares",
        hide_details=True,
    )
    html.Div("{{ square_status }}", classes="text-body-2 mt-2")


def _cube_controls() -> None:
    vuetify3.VSelect(
        v_model=("rotation_axis", "y"),
        items=["x", "y", "z"],
        label="Rotation axis",
        disabled=("!cube_exists",),
        hide_details=True,
    )
    vuetify3.VSlider(
        v_model=("rotation_speed", DEFAULT_ROTATION_SPEED),
        min=MIN_ROTATION_SPEED,
        max=MAX_ROTATION_SPEED,
        step=ROTATION_STEP,
        label="Rotation speed",
        disabled=("!cube_exists",),
        hide_details=True,
    )
    vuetify3.VSlider(
        v_model=("cube_scale", DEFAULT_SCALE),
        min=MIN_SCALE,
        max=MAX_SCALE,
        step=SCALE_STEP,
        label="Scale",
        disabled=("!cube_exists",),
        hide_details=True,
    )
    vuetify3.VTextField(
        v_model=("cube_color", DEFAULT_COLOR),
        label="Color",
        disabled=("!cube_exists",),
    )
    html.Div("{{ cube_status }}", classes="text-body-2 mt-2")


def _exploding_controls() -> None:
    vuetify3.VSlider(
        v_model=("sphere_scale", DEFAULT_SPHERE_SCALE),
        min=MIN_SPHERE_SCALE,
        max=MAX_SPHERE_SCALE,
        step=SPHERE_SCALE_STEP,
        label="Sphere scale",
        hide_details=True,
    )
    vuetify3.VSlider(
        v_model=("max_cubes", DEFAULT_MAX_CUBES),
        min=MIN_MAX_CUBES,
        max=MAX_MAX_CUBES,
        step=1,
        label="Max cubes",
        hide_details=True,
    )
    vuetify3.VSlider(
        v_model=("camera_speed", DEFAULT_CAMERA_ROTATION_SPEED),
        min=MIN_CAMERA_ROTATION_SPEED,
        max=MAX_CAMERA_ROTATION_SPEED,
        step=0.1,
        label="Camera orbit speed",
        hide_details=True,
    )
    html.Div("{{ exploding_status }}", classes="text-body-2 mt-2")
