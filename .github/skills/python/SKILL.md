---
name: python
description: Write and refactor Python 3.13 code using SOLID design and strict snake_case rules, and build PyVista / trame / trame-vtk 3D apps. Use when asked to create or review Python modules, classes, or scripts, apply SOLID, or structure PyVista/trame code. For unit tests (pytest, Fake/Spy/Mock, public and protected method coverage) also read py-testing.md.
license: MIT
---

# Python 3.13 – SOLID code and snake rules

Default home for Python code: `python3.13/`. Testing rules (public + protected
method coverage, Fake/Spy/Mock, pytest) live in [py-testing.md](./py-testing.md) –
**read it whenever you write or change tests**.

## Fixed technology choices

| Concern | Choice |
| --- | --- |
| Python | **3.13.x** (`requires-python = ">=3.13,<3.14"`) |
| 3D bundle | `pyvista`, `trame`, `trame-vtk` (plus `trame-vuetify` for layout); do not add another 3D library |
| Test framework | **pytest** + pytest-mock + pytest-cov |
| Lint / format / types | `ruff` (rules `E F I N UP B SIM C4 PT RET ARG ANN`), `mypy --strict` |

## Workflow

1. Define the unit's single responsibility.
2. Define a `typing.Protocol` port for every external dependency (rendering, I/O, clock, RNG, trame server).
3. Implement the class with dependencies injected through `__init__`; build concretes only in the composition root (`build_app()` / `main()`).
4. Apply the snake rules below; add type hints to every signature.
5. Write tests per [py-testing.md](./py-testing.md) covering public **and** protected methods.
6. Run `ruff check`, `ruff format --check`, `mypy`, `pytest --cov` before finishing.

## SOLID rules

- **S – Single Responsibility**: one reason to change. Separate geometry/math, rendering, I/O, and UI wiring.
- **O – Open/Closed**: add behaviour with a new strategy class registered in a mapping, not by extending `if/elif`/`isinstance` chains.
- **L – Liskov**: subclasses and fakes keep the same argument meaning, return type, and raised exceptions. Do not override only to raise `NotImplementedError`.
- **I – Interface Segregation**: several small Protocols (`MeshReader`, `MeshWriter`) instead of one fat interface.
- **D – Dependency Inversion**: depend on Protocols; inject `rng: random.Random` and `clock: Callable[[], float]`; no module-level singletons or global state.

```python
class ShapeBuilder(Protocol):
    def build(self, size: float) -> pv.PolyData: ...

class ShapeRegistry:                       # open for extension, closed for modification
    def __init__(self) -> None:
        self._builders: dict[str, ShapeBuilder] = {}

    def register(self, name: str, builder: ShapeBuilder) -> None:
        self._builders[name] = builder

    def build(self, name: str, size: float) -> pv.PolyData:
        try:
            return self._builders[name].build(size)
        except KeyError:
            raise UnknownShapeError(name) from None
```

Template Method hooks use protected methods (`_validate`, `_serialize`); they are
part of the subclass contract and must be tested.

## Snake rules

| Element | Style | Example |
| --- | --- | --- |
| Package / module | `snake_case` | `cube_scene.py` |
| Function / method / variable / parameter | `snake_case`, verbs for functions, nouns for data | `build_cube_mesh`, `edge_length` |
| Constant | `UPPER_SNAKE_CASE` + `Final` | `MAX_CUBE_COUNT: Final = 500` |
| Class / Protocol / Enum | `PascalCase` noun | `CubeFactory`, `SceneRenderer` |
| Exception | `PascalCase` + `Error` | `EmptyMeshError` |
| Test function | `test_<unit>__<condition>__<expected>` | `test_build__zero_edge__raises_value_error` |

Visibility: 
- `name` = public contract; 
- `_name` = protected (internal/subclass hook);
- `__name` = avoid (extract to a collaborator instead).

Style rules:

1. Booleans read as questions: `is_`, `has_`, `can_`, `should_`; no negatives (`is_not_ready`).
2. Plural names for collections; `<key>_to_<value>` for mappings; units in ambiguous names (`timeout_seconds`, `angle_degrees`).
3. No abbreviations except `id`, `url`, `rng`, `vtk`, and `x/y/z`.
4. Function ≤ 20 lines, nesting ≤ 3 (use early returns), ≤ 3 parameters before grouping into `@dataclass(frozen=True, slots=True)`; flags are keyword-only (`*`).
5. 3.13 idioms: `X | None`, built-in generics, `type` aliases, `enum.StrEnum`, `match` for closed sets, `pathlib`, f-strings, `with` for resources.
6. Docstrings (Google style) on public API; comments explain *why*.
7. Forbidden: mutable default arguments, bare `except:`, `except Exception: pass`, `import *`, import-time side effects (opening windows, starting servers), `global`, `print` for diagnostics (use `logging`), `assert` for runtime validation.

## PyVista + trame + trame-vtk

Install: `pip install pyvista trame trame-vtk trame-vuetify` (PyVista pulls in `vtk` with Python 3.13 wheels).

Structure (dependencies point inward):

```text
src/<package>/
├── geometry/   # pure code -> pyvista.PolyData, no plotter
├── ports.py    # Protocols: SceneRenderer, ViewController
├── scene.py    # orchestrates geometry + ports
├── adapters/   # pyvista_renderer.py (wraps pv.Plotter), trame_controller.py
└── app.py      # composition root
```

```python
class SceneRenderer(Protocol):
    def add_mesh(self, mesh: pv.PolyData, *, name: str | None = None) -> None: ...
    def clear(self) -> None: ...
    def refresh(self) -> None: ...

class PyVistaRenderer:                     # thin adapter, no logic
    def __init__(self, plotter: pv.Plotter) -> None:
        self._plotter = plotter

    def add_mesh(self, mesh: pv.PolyData, *, name: str | None = None) -> None:
        self._plotter.add_mesh(mesh, name=name)
    def clear(self) -> None:
        self._plotter.clear_actors()
    def refresh(self) -> None:
        self._plotter.render()
```

trame composition root:

```python
from pyvista.trame.ui import plotter_ui
from trame.app import get_server
from trame.ui.vuetify3 import SinglePageLayout
from trame.widgets import vuetify3

def build_app(plotter: pv.Plotter | None = None):
    plotter = plotter or pv.Plotter()
    server = get_server(client_type="vue3")
    with SinglePageLayout(server) as layout:
        layout.title.set_text("PyVista + trame")
        with layout.content:
            with vuetify3.VContainer(fluid=True, classes="pa-0 fill-height"):
                server.controller.view_update = plotter_ui(plotter)
    return server

if __name__ == "__main__":
    build_app().start()
```

- Use `trame_vtk.widgets.vtk` (`VtkRemoteView`, `VtkLocalView`) when working with a raw `vtkRenderWindow`.
- UI state in `server.state`; keep `@state.change("key")` and `@ctrl.add("name")` handlers thin, delegating to injected services.
- Call `ctrl.view_update()` after changing the scene, otherwise the UI looks stale.
- Never create `pv.Plotter()` or call `server.start()` at import time.

## Definition of done

- [ ] SOLID and snake rules respected; type hints on all signatures.
- [ ] Public and protected methods covered (see [py-testing.md](./py-testing.md)); branch coverage ≥ 70 %.
- [ ] `ruff`, `mypy`, and `pytest --cov` pass on Python 3.13.
