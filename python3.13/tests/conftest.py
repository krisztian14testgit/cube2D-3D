"""Shared test setup. Plotters stay off-screen; nothing starts a server."""

from __future__ import annotations

import pyvista as pv

pv.OFF_SCREEN = True
