# Grok 4.7 — Python playground

Standalone Python 3.13 app for the cube brief. It is not part of the Vite
menu. Two trame pages each stack two features behind a visible divider:

| Menu label | Page id | Top | Bottom |
| --- | --- | --- | --- |
| Grok 4.7 — 2D-coord | `coord_2d` | coordinate system | bouncing squares |
| Grok 4.7 — 3D-cubes | `cubes_3d` | single 3D cube | exploding cubes |

Rendering uses PyVista. The UI uses trame, trame-vtk, trame-vuetify, and
trame-pyvista (`plotter_ui` on PyVista 0.49).

## Install

From this folder, with the existing Python 3.13 environment that already has
PyVista and trame:

```text
python -m pip install -e ".[dev]"
```

## Run

```text
python -m grok_4_7
```

The server listens on port **8080** so it does not collide with Vite on 3500.
Left-click spawns or creates. Right-drag orbits the 3D views. The wheel zooms.

## Test

```text
ruff check src tests
ruff format --check src tests
mypy
pytest
```

`pytest` runs branch coverage and fails under 90%. Tests marked `integration`
need a real render window and are excluded by default.
