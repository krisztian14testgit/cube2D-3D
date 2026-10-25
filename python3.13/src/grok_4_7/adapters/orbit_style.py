"""Right-drag orbit, wheel zoom, and left-click reserved for picking."""

from __future__ import annotations

from collections.abc import Callable
from typing import Protocol

import vtk

from grok_4_7.math_types import Vec3
from grok_4_7.orbit import clamp_orbit_radius


class ClickInteractor(Protocol):
    """Subset of a VTK interactor used to bind the left button."""

    def AddObserver(self, event: str, callback: Callable[[object, str], None]) -> object:
        """Register an event callback and return its handle."""


class RightDragOrbitStyle(vtk.vtkInteractorStyleTrackballCamera):
    """Orbit on the right button. The left button is left free for spawning."""

    def __init__(self) -> None:
        super().__init__()
        self.AddObserver("RightButtonPressEvent", self._start_rotate)
        self.AddObserver("RightButtonReleaseEvent", self._end_rotate)
        self._rotating = False
        self._lower_radius = 4.0
        self._upper_radius = 40.0

    def OnLeftButtonDown(self) -> None:  # noqa: N802
        """Ignore left-drag so it cannot swallow a create or spawn click."""
        return

    def OnLeftButtonUp(self) -> None:  # noqa: N802
        """Ignore the matching left-button release."""
        return

    def OnMouseWheelForward(self) -> None:  # noqa: N802
        """Zoom in, then keep the camera inside the radius limits."""
        super().OnMouseWheelForward()
        self._clamp_active_camera()

    def OnMouseWheelBackward(self) -> None:  # noqa: N802
        """Zoom out, then keep the camera inside the radius limits."""
        super().OnMouseWheelBackward()
        self._clamp_active_camera()

    def set_radius_limits(self, lower: float, upper: float) -> None:
        """Store wheel-zoom limits and pull an attached camera inside them."""
        self._lower_radius = lower
        self._upper_radius = upper
        self._clamp_active_camera()

    @property
    def is_rotating(self) -> bool:
        """Whether a right-drag rotate is in progress."""
        return self._rotating

    def _start_rotate(self, _caller: object, _event: str) -> None:
        self._rotating = True
        self.StartRotate()

    def _end_rotate(self, _caller: object, _event: str) -> None:
        self._rotating = False
        self.EndRotate()

    def _clamp_active_camera(self) -> None:
        renderer = self.GetCurrentRenderer()
        if renderer is None:
            return
        camera = renderer.GetActiveCamera()
        if camera is None:
            return
        _clamp_vtk_camera(camera, self._lower_radius, self._upper_radius)


def _clamp_vtk_camera(camera: object, lower: float, upper: float) -> None:
    position = camera.GetPosition()  # type: ignore[attr-defined]
    focal = camera.GetFocalPoint()  # type: ignore[attr-defined]
    clamped = clamp_orbit_radius(Vec3(*position), Vec3(*focal), lower, upper)
    camera.SetPosition(clamped.x, clamped.y, clamped.z)  # type: ignore[attr-defined]


def configure_interaction(
    plotter: object,
    on_left_click: Callable[[float, float], None],
    *,
    orbit: bool,
) -> None:
    """Bind left-click and, on 3D views, right-drag orbit. Missing interactors are ignored."""
    iren = getattr(plotter, "iren", None)
    if iren is None:
        return
    if orbit:
        _install_orbit_style(iren)
    _bind_left_click(iren, on_left_click)


def _install_orbit_style(iren: object) -> None:
    style = RightDragOrbitStyle()
    if hasattr(iren, "SetInteractorStyle"):
        iren.SetInteractorStyle(style)
        return
    iren.style = style  # type: ignore[attr-defined]


def _bind_left_click(iren: object, on_left_click: Callable[[float, float], None]) -> None:
    def _on_press(caller: object, _event: str) -> None:
        position = caller.GetEventPosition()  # type: ignore[attr-defined]
        on_left_click(float(position[0]), float(position[1]))

    if hasattr(iren, "AddObserver"):
        iren.AddObserver("LeftButtonPressEvent", _on_press)
        return
    iren.add_observer("LeftButtonPressEvent", _on_press)  # type: ignore[attr-defined]
