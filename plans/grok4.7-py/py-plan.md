# Grok 4.7 Python implementation plan

Audience: the AI agent that will implement this app. This file is the spec.
Follow it. Do not invent a different layout, stack, or feature-package name.

## Goal

Build a standalone Python 3.13 playground for **Grok 4.7** that implements the
same feature brief as the JavaScript model folders, using PyVista and trame.
Two trame menu pages, each stacking two features behind a visible line divider.

| Menu label | Page id | Top section | Divider | Bottom section |
| --- | --- | --- | --- | --- |
| Grok 4.7 — 2D-coord | `coord_2d` | coordinate system | yes | bouncing squares |
| Grok 4.7 — 3D-cubes | `cubes_3d` | single 3D cube | yes | exploding cubes |

Code home: `python3.13/src/grok_4_7/`. This is not a page inside the Vite app.
Do not edit `es2025/`, other model folders, or `Menu.js`.

## Decisions already confirmed

- Package layout: `python3.13/src/grok_4_7/` with snake_case feature packages.
- Feature names: `coordinate_system`, `bouncing_squares`, `cube_3d`, `cubes_exploding`.
- Navigation labels: `Grok 4.7 — 2D-coord` and `Grok 4.7 — 3D-cubes`.
- Numeric defaults are defined in this plan. 3D limits match Grok 4.5.
  2D limits are the Grok 4.7 contract (Grok 4.5 has no 2D code).
- Layout toolkit includes `trame-vuetify` (required by the Python skill for
  `SinglePageLayout`). Do not add matplotlib, Babylon.js, Three.js, or another
  3D library.

## Hard rules

1. Read `.github/skills/python/SKILL.md` and `.github/skills/python/py-testing.md`
   before writing code. Follow them. This plan does not repeat every snake rule.
2. Python **3.13 only** (`requires-python = ">=3.13,<3.14"`).
3. SOLID and dependency inversion: pure math has no PyVista, trame, or VTK
   import. Protocols for renderer, picker, clock, and RNG. Concretes are built
   only in `build_app()` / `main()`.
4. Inject `rng: random.Random` and `clock: Callable[[], float]`. No module-level
   `random.random`, no `time.time` inside domain code, no global plotter.
5. Never construct `pv.Plotter` or call `server.start()` at import time.
6. Snake_case modules and functions. `Final` constants. Frozen slotted
   dataclasses for state. Functions ≤ 20 lines, nesting ≤ 3, ≤ 3 parameters
   before a dataclass. Google docstrings on public API.
7. Adapt Grok 4.5 **responsibilities and invariants**. Do not transliterate
   JavaScript. Do not copy GPT, Gemini, or Claude 2D code. Model isolation
   applies: this package must not import another model's implementation.
8. Page modules stay thin, like `es2025/src/pages/menu7.js`: wire features,
   divider, and cleanup. No physics in pages.
9. `logging` only. No `print`. No bare `except`. No `assert` for runtime checks.
10. Tests live in `python3.13/tests/`, not beside production modules.

## Read before coding

Behavior and structure references (adapt, do not copy):

- `README.md` — steps 1, 2, and 4 of the cube project.
- `.github/copilot-instructions.md` — feature definitions for
  `coordinate-system`, `bouncing-squares`, `cube-3d`, `cubes-exploding`.
- `plans/grok4.5/grok-3D-imp-plan.md`
- `plans/grok4.5/grok-cubes-exploding.md`
- `es2025/src/grok4.5/features/cube-3d/BabylonCubeController.js`
- `es2025/src/grok4.5/features/cube-3d/render3DCubePage.js`
- `es2025/src/grok4.5/features/cubes-exploding/cubesExplodingMath.js`
- `es2025/src/grok4.5/features/cubes-exploding/BabylonCubesExplodingController.js`
- `es2025/src/grok4.5/features/cubes-exploding/renderCubesExplodingSection.js`
- `es2025/src/pages/menu7.js`

Do not open other models' `features/` trees to harvest an implementation.

## Feature contract

World axes are right-handed and match PyVista / the Grok 4.5 Babylon scene:
**+X right, +Y up, +Z toward the viewer** when the camera looks at the origin
from +Z. Do not flip Y to imitate an HTML canvas.

### 1. Coordinate system (`coord_2d` top)

Always-visible 2D grid on the XY plane (`z = 0`). Not click-to-spawn.
That behavior belongs to bouncing squares.

- Half-extent `10`: grid and axes run from `-10` to `10`.
- Tick step `1`. Label anchors at `-10, -5, 0, 5, 10` on both axes.
- X axis red `#ff0000`, Y axis green `#00ff00`. No Z axis in this section.
- Grid lines neutral gray. Background `(0.97, 0.97, 0.97)`.
- One axis-aligned square, edge `1`, center `(0, 0, 0)`, color `#87cefa`.
- Scale slider: min `0.5`, max `3`, step `0.1`, default `1`. Uniform XY scale.
- Orthographic camera: position `(0, 0, 30)`, focal point `(0, 0, 0)`,
  view-up `(0, 1, 0)`, parallel projection on.
- Invariant: logical point `(x, y)` is world point `(x, y, 0)`. Screen-up is +Y.

### 2. Bouncing squares (`coord_2d` bottom)

Separated from the coordinate system by `VDivider`. Own plotter, same world
bounds and camera rule so the two sections agree.

- Left-click on the plane spawns one square at the picked `(x, y)`.
- Ignore clicks outside `[-10, 10]` or when the active count is at the max.
- Random edge length in `[0.4, 1.6]`.
- Max-count control: min `5`, max `40`, default `20`.
- Each velocity component is uniform in `[-3, 3]` world-units per second.
- Rotation is around **Z only**, angular speed uniform in `[-2, 2]` rad/s.
- Collision and wall tests use the bounding circle
  `radius = edge_length * sqrt(2) / 2` so rotation cannot stick a corner
  through the wall. This is the 2D analogue of Grok 4.5 `cubeHalfExtent`.
- Wall bounce: if the center is outside the inner limit
  (`10 - radius`) **and** that axis velocity points outward, negate only that
  component and clamp the center back to the limit. Do not reverse an inward
  component. Do not bounce a square that is still inside.
- Pair collision when circle distance `< radius_a + radius_b` (strict `<`,
  same as Grok 4.5). Exact contact does not collide.
- Remove every index that participates in at least one pair. Remove highest
  index first. Remove each index once. Leave non-colliding squares in place.
  No particle effect in 2D.
- Status text: `Squares: {count} / {max}`.

### 3. Single 3D cube (`cubes_3d` top)

Port the Grok 4.5 single-cube feature. The cube stays at the origin. It does
not translate. "Movement" in the brief is continuous rotation, not travel.

| Constant | Value |
| --- | --- |
| Axis length | `4` |
| Axis colors | X `#ff0000`, Y `#00ff00`, Z `#0000ff` |
| Default rotation axis | `y` |
| Rotation speed | `0` to `6` rad/s, step `0.1`, default `1` |
| Scale | `0.5` to `3`, step `0.1`, default `1` |
| Color | `#87cefa` |
| Camera | orbit, initial alpha `pi/4`, beta `pi/3`, radius `12`, target origin |

- Click inside the view creates one cube if missing. Later clicks do nothing.
- `create_cube_if_missing()` returns `True` only on the first create, else `False`.
- Controls stay disabled until the cube exists.
- `set_cube_scale` before a cube exists is a no-op and returns `False`.
- Rotation is already time-based in Grok 4.5
  (`rotation_speed * delta_seconds`). Port that. Do **not** multiply by 60.
- Unknown axis (`not in {"x", "y", "z"}`) raises `InvalidAxisError`.
- Color that is not `#` plus 6 hex digits raises `InvalidColorError`.
- Status: `Click the view to create the cube.` then
  `Cube is active. Adjust transform and rotation controls.`

### 4. Exploding cubes (`cubes_3d` bottom)

`VDivider`, then this section. Own plotter. Port
`cubesExplodingMath.js` formulas exactly.

| Constant | Value | Notes |
| --- | --- | --- |
| `DEFAULT_SPHERE_SCALE` | `8` | Sphere **radius**, not diameter |
| Sphere scale slider | `4` to `20`, step `0.5` | |
| `DEFAULT_MAX_CUBES` | `10` | |
| Max-cubes range | `10` to `100` | non-finite → `10`; else round and clamp |
| Cube edge | `[1, 5]` | mesh edge equals this scale |
| `cube_half_extent` | `scale * sqrt(3) / 2` | bounding-sphere radius |
| Spawn shrink | `0.85` | same `clamp_point_inside_sphere` formula |
| Linear component | `4.8` units/s | JS `0.08` per frame × 60 |
| Angular component | `2.4` rad/s | JS `0.04` per frame × 60 |
| Camera orbit speed | `0.1` to `5`, default `1` | sensitivity, not cube spin |
| Sphere segments | `32` | wireframe, alpha about `0.15`, pickable |
| Scene background | `(0.12, 0.12, 0.16)` | |
| Explosion | 80 points, life `0.15`–`0.45` s, dispose after `0.45` s | orange burst, no new library |

Grok 4.5 integrates exploding motion **once per frame**. Python must not do
that. Store velocity in units per second and integrate
`position += velocity * delta_seconds`. A step of `1/60` must move the same
distance as one Grok 4.5 frame. Single-cube rotation is already per second;
do not apply this ×60 conversion there.

- Left-click picks the sphere and spawns one cube. Miss, or count at max,
  returns `False` and spawns nothing.
- Spawn point is clamped inside the sphere with the `0.85` shrink.
- Random diffuse color per channel: `0.3 + rng.random() * 0.7`.
- Bounce only when distance from origin is beyond
  `max(0, sphere_radius - half_extent)` **and** `dot(position, velocity) > 0`.
  Then negate velocity. Coerce `-0.0` to `0.0`, matching `bounceVelocity`.
- Do not delete cubes when the sphere scale changes. Do not pull inward cubes
  back inside. That matches Grok 4.5; do not "improve" it.
- Collision: strict `<` on bounding spheres. Collect every involved index,
  sort descending, explode, dispose mesh and material, splice once.
- Changing max cubes never deletes existing cubes. It only blocks new spawns
  when `count >= max`.
- Status: `Cubes: {count} / {max}`.
- Camera: right-drag orbits the origin, wheel zooms, left-click spawns and
  does **not** orbit. Suppress the browser context menu on right-drag.
  Radius limits: lower `4`, upper `max(40, sphere_scale * 6)`.
- `set_sphere_scale` ignores non-finite or `<= 0` and leaves state unchanged.

## Architecture

Dependencies point inward: `math` / `geometry` → `simulation` / `scene` →
`adapter` → `app`.

```text
python3.13/
  pyproject.toml
  README.md
  src/grok_4_7/
    __init__.py
    app.py                      # build_app(), main(); composition root
    errors.py
    ports.py                    # shared Protocols only
    pages/
      coord_2d_page.py          # two sections + VDivider + combined cleanup
      cubes_3d_page.py
    features/
      coordinate_system/
        constants.py
        geometry.py             # grid, axes, square mesh specs; no plotter
        scene.py
      bouncing_squares/
        constants.py
        math.py
        simulation.py           # step(); no PyVista
        scene.py
      cube_3d/
        constants.py
        geometry.py
        scene.py
      cubes_exploding/
        constants.py
        math.py                 # port of cubesExplodingMath.js
        simulation.py
        effects.py              # burst lifetime, no VTK
        scene.py
  tests/
    conftest.py
    fakes/
      renderers.py
    grok_4_7/
      ...                       # test_<module>.py mirroring src
```

Adapters are thin and may live as `features/<name>/adapter.py` **or** as
methods on a `PyVistaRenderer` in `src/grok_4_7/adapters/`. Pick one place and
do not split the same feature across both. Recommended: one
`src/grok_4_7/adapters/pyvista_renderer.py` implementing the shared
`SceneRenderer` port, plus a `ViewPicker` port for click-to-world. Feature
scenes depend on those ports, not on `pv.Plotter`.

### Ports

```python
class SceneRenderer(Protocol):
    def add_mesh(self, mesh: pv.PolyData, *, name: str, color: str, style: str = "surface") -> None: ...
    def remove(self, name: str) -> None: ...
    def clear(self) -> None: ...
    def set_transform(self, name: str, *, position: Vec3, orientation_radians: Vec3, scale: float) -> None: ...
    def refresh(self) -> None: ...

class ViewPicker(Protocol):
    def pick_xy_plane(self, x_px: float, y_px: float) -> Vec3 | None: ...
    def pick_sphere(self, x_px: float, y_px: float) -> Vec3 | None: ...
```

`Vec3` is a frozen slotted dataclass in `grok_4_7/math_types.py` (name avoids
clashing with a `math` feature module). Scenes never import `pyvista`.

Geometry functions return `pv.PolyData`. That is allowed: PolyData is data,
not a plotter. Building a `Plotter` inside geometry is not allowed.

### Scene APIs the tests will call

Coordinate system:

- `build() -> None`
- `set_square_scale(scale: float) -> None` — `ValueError` if non-finite or
  outside `[0.5, 3]`
- `square_scale -> float`
- `dispose() -> None` — safe before `build`

Bouncing squares:

- `spawn_at(point: Vec3) -> bool`
- `set_max_squares(value: float) -> int` — clamped
- `step(delta_seconds: float) -> None`
- `square_count -> int`
- `dispose() -> None`

Single cube:

- `create_cube_if_missing() -> bool`
- `set_cube_scale(scale: float) -> bool`
- `set_rotation_axis(axis: str) -> None`
- `set_rotation_speed(speed: float) -> None`
- `set_cube_color(color_hex: str) -> None`
- `step(delta_seconds: float) -> None`
- `dispose() -> None`

Exploding cubes:

- `spawn_at(point: Vec3) -> bool`
- `try_spawn_at_screen(x_px: float, y_px: float) -> bool`
- `set_sphere_scale(scale: float) -> None`
- `set_max_cubes(value: float) -> int`
- `set_camera_rotation_speed(value: float) -> float`
- `step(delta_seconds: float) -> None`
- `cube_count -> int`
- `dispose() -> None` — cancels bursts, removes meshes, safe after partial init

`step` is the test seam. The trame timer calls `step(clock_delta)` and then
`renderer.refresh()`. No second hidden integration loop.

## UI and navigation

One trame server, Vue 3, Vuetify 3 `SinglePageLayout`.

- Toolbar title: `Grok 4.7`.
- Two buttons (or tabs), labels exactly `Grok 4.7 — 2D-coord` and
  `Grok 4.7 — 3D-cubes`. Active page is `server.state.page`
  (`coord_2d` default).
- Each page shows a "Created by Grok 4.7" line, an `h2`, a one-sentence
  instruction, then the top feature, then `vuetify3.VDivider`, then the
  bottom feature. The divider must be visible in the layout, not only in CSS
  that is never applied.
- Each feature has its own `pv.Plotter` and `plotter_ui` view. Do not draw
  both features into one plotter.
- Controls sit beside the view: scale, axis select, speed, color, max count,
  sphere scale, camera orbit speed, status text. Use Vuetify sliders,
  selects, and text fields. Hex color is a text field validated as
  `^#[0-9A-Fa-f]{6}$`.
- `@state.change` and `@ctrl.add` handlers only forward to the scene. No
  math in the handler.
- After a scene mutation, call `ctrl.view_update()` or the per-view update
  the adapter registered. A stale view is a defect.
- Default server port **8080** so it does not collide with Vite on 3500.

### Page lifecycle

Only the active page owns plotters and timers.

- Entering a page builds that page's two plotters and starts **one** timer.
- Leaving a page calls both features' `dispose()`, stops the timer with the
  same handle used to start it, and closes plotters.
- Re-entering builds fresh scenes. Do not resume disposed actors.
- `dispose()` may run twice and may run before init. Both are no-ops after
  the first successful cleanup.
- Switching pages must not leave a render callback, VTK interactor observer,
  or timer alive. Tests prove this with a fake timer and a fake renderer.

Right-drag orbit is an adapter concern. Configure the VTK interactor style
so button 2 orbits, the wheel zooms, and button 0 is reserved for picking.
Do not leave the default left-drag rotate in place on the exploding view or
on the single-cube view if it swallows the create click. Single-cube orbit
may use left-drag **only if** a separate "create cube" control still works
when the interactor eats the click. Prefer the Grok 4.5 split: left-click
creates/spawns, right-drag orbits, on both 3D views.

## Time and randomness

- Clamp each frame delta to `MAX_DELTA_SECONDS = 0.05` before `step`, so a
  stalled tab cannot tunnel through the sphere. Record the unclamped delta
  only in logs at debug, not as the integration step.
- Tests pass an explicit `delta_seconds`. They do not sleep.
- Tests construct `random.Random(1234)` and pass it in. Do not patch
  `random` or `time`.
- Empty collections: `step` on zero squares/cubes returns without work.

## Implementation order

Do these in order. Do not start a feature's adapter before its pure tests pass.

1. `python3.13/pyproject.toml` and package skeleton. Dependencies:
   `pyvista`, `trame`, `trame-vtk`, `trame-vuetify`. Dev: `pytest`,
   `pytest-mock`, `pytest-cov`, `ruff`, `mypy`. Ruff select
   `E F I N UP B SIM C4 PT RET ARG ANN`. `mypy --strict`. Pytest config from
   `py-testing.md`, including `--cov-fail-under=90` and
   `--cov-branch`. Marker `integration` excluded by default.
2. `errors.py`, `math_types.py`, `ports.py`, fakes.
3. `cubes_exploding/math.py` plus tests. This is the parity core. Port every
   function in `cubesExplodingMath.js`: clamp max cubes, clamp camera speed,
   random scale, random velocity, random rotation speed, half extent,
   distance, dot, collision indexes, descending sort, bounce predicate,
   bounce velocity, clamp point inside sphere.
4. `bouncing_squares/math.py` and `simulation.py` plus tests.
5. `coordinate_system/geometry.py` and `scene.py` plus tests (fake renderer).
6. `cube_3d` geometry and scene plus tests.
7. `cubes_exploding` simulation, effects, scene plus tests.
8. PyVista adapter with `create_autospec(pv.Plotter)` tests. Off-screen real
   plotter tests, if any, are `@pytest.mark.integration`.
9. Thin pages and `build_app()`. Trame tests use
   `get_server("grok-4-7-test-<unique>", client_type="vue3")` and never
   `start()`.
10. `python3.13/README.md`: install, `python -m grok_4_7`, port 8080, test
    command. Update the root `README.md` Python bullet from "empty
    placeholder" to this package and the two menu labels. Update the
    `python3.13/` line in `.github/copilot-instructions.md` the same way.
    Do not rewrite those files.

## Test requirements

Follow `py-testing.md`: public and protected methods, happy / edge / error,
fakes for state, autospec mocks only for commands, one contract test so a
fake cannot drift from the port.

Minimum cases:

- Coordinate: logical `(1, 2)` becomes world `(1, 2, 0)`; scale `0.5` and `3`
  accepted; `0.49`, `3.01`, and `nan` raise; dispose before build is safe;
  axes use the three distinct colors on the 3D page and two on the 2D page.
- Bouncing: spawn at max returns `False`; click outside bounds returns
  `False`; velocity reverses only the outward axis; inward velocity at the
  wall is kept; exact circle contact does not remove; overlap removes both
  indexes once; a third square remains; zero squares `step` is a no-op;
  delta `0` does not move centers.
- Single cube: second create returns `False`; scale before create returns
  `False` and does not create; one second at speed `1` on Y adds `1` radian
  on Y and `0` on X/Z; bad axis and bad color raise; dispose removes the
  resize/timer registration.
- Exploding: non-finite max cubes becomes `10`; `100.6` clamps to `100`;
  scale always in `[1, 5]` for a seeded RNG; `1/60` step matches one JS
  frame of the ×60-converted velocity; bounce when outside and outward;
  no bounce when outside and inward; no bounce when inside; `-0.0` becomes
  `0.0`; collision removes descending indexes and asks the effect port to
  spawn one burst per removed cube; spawn at max returns `False`;
  `set_sphere_scale(0)` and `nan` do not change the radius; dispose after
  a burst cancels it; dispose before init does not raise.
- Pages: each page contains both section titles and a divider; control
  events reach the scene; leaving the page disposes both scenes and the
  timer; handlers do not call `server.start`.

Assert state and return values. Do not assert only that a mock was called.

## Validation the implementing agent must run

From `python3.13/`:

```text
ruff check src tests
ruff format --check src tests
mypy
pytest
```

`pytest` already includes branch coverage with fail-under 90. Do not lower
the gate to make a weak test pass. Fix the code or add a real assertion.

## Out of scope

- Wiring these pages into `es2025/src/components/Menu.js`.
- Sharing modules with `es2025/src/grok4.5/` or any other model.
- A third page, persistence, accounts, or network calls.
- Screenshot tests and GPU-required checks in the default suite.
- Rewriting Grok 4.5 JavaScript.

## Definition of done

- Both menus render the two features separated by a visible divider.
- Constants and collision/bounce rules match this plan.
- Pure math has no rendering import. `build_app()` is the only composition root.
- `dispose` is idempotent and safe after partial init.
- Ruff, format check, mypy strict, and pytest with branch coverage ≥ 90 pass
  on Python 3.13.
- Root README and copilot instructions no longer say `python3.13/` is empty.
