---
applyTo:
  - "src/gpt5.3-codex/**"
  - "src/gemini3.1-pro/**"
  - "src/grok4.5/**"
description: "Modern vanilla JavaScript clean-code and Vitest testing review rules for the gpt5.3-codex, gemini3.1-pro and grok4.5 LLM solution folders (3D cube + coordinate-system and cubes-exploding features)."
---

# Code Review Guidelines — Modern JavaScript, Clean Code & Vitest Testing

## Purpose

This repository compares independent implementations of the same cube 2D/3D
spec written by different LLMs, one folder per model. These rules apply only
to code under `src/gpt5.3-codex/`, `src/gemini3.1-pro/` and `src/grok4.5/`.

Do **not** apply these rules to `src/claude-sonnet-4.6/`, `src/components/`,
`src/pages/`, `main.js`, or `plans/` — they are out of scope for this
instruction file.

Give the most attention to the two active feature areas in these folders:

- **3D cube rendering with a coordinate system** (`features/coordinate-system`,
  `features/cube-3d`) — canvas 2D grid/axes drawing and Babylon.js/Three.js
  cube scenes with rotation, scale and camera controls.
- **Cubes exploding** (`features/cubes-exploding`) — spawning, physics
  (velocity, collision, bounce), and disposal of many 3D cubes inside a
  bounding sphere.

Because each folder is a separate LLM's independent solution to the same
brief, similar or duplicated logic **across** `gpt5.3-codex` / `gemini3.1-pro`
/ `grok4.5` is expected and is **not** a DRY violation worth flagging. Only
flag duplication **within the same folder** (e.g. two files in the same
model's `features/` tree re-implementing the same math or DOM wiring).

## Modern JavaScript (ES2022+) Style

- Use `const` by default, `let` only when a binding is reassigned. Never use `var`.
- Use real private class fields (`#field`) for internal state and bound
  handlers instead of the `_underscorePrefix` convention, which is not
  actually private and can be accessed/mutated from outside the class.

  ```javascript
  // Avoid — the leading underscore is only a naming convention
  class CoordinateSystem {
    _canvas = null;
    _origin = null;
  }

  // Prefer — enforced by the language
  class CoordinateSystem {
    #canvas = null;
    #origin = null;
  }
  ```

- Prefer object-destructured parameters with defaults over long positional
  argument lists, as already done in `renderCoordinateMenuPage(container, { title, canvasId, sliderId })`-style
  functions. Keep that pattern consistent for new options.
- Replace magic numbers with named constants at module scope, the way
  `cubesExplodingMath.js` exports `MIN_CUBE_SCALE` / `MAX_CUBE_SCALE`. Flag
  inline literals such as a hardcoded particle count, box size, or `maxAge`
  frame count buried inside a class body.
- Use guard clauses / early returns instead of nesting the main logic inside
  `if` blocks.
- Prefer `Object.freeze` (or module-level constants) for fixed configuration
  objects that must not be mutated at runtime, matching
  `DEFAULT_CUBE_POSITION = Object.freeze({ x: 10, y: 10 })`.
- Do not leave `console.log`/`console.error` as the only error-handling path
  for a caller-recoverable failure. Throw a descriptive `Error` (as
  `CoordinateSystem` already does for a missing canvas) or return a result the
  caller can branch on; reserve `console.*` for genuinely unrecoverable,
  fire-and-forget diagnostics.
- Prefer composition over inheritance for scene/controller classes; keep
  class hierarchies flat.

## Architecture: Separate Pure Logic From Rendering (SRP)

Extract math and state-transition logic (collision detection, bounce/clamp
rules, random velocity/scale generation) into small, pure, dependency-free
functions that a rendering/controller class calls — mirroring the split
between `cubesExplodingMath.js` (pure functions) and
`BabylonCubesExplodingController.js` (Babylon.js orchestration only).

- A pure function must not read the DOM, a canvas context, or a 3D engine
  object; it should take plain values/objects and return plain values.
- Randomness and time must be injectable (`rng = Math.random`, a delta-time
  argument) rather than called directly inside logic you expect to unit
  test, following the `randomCubeScale(min, max, rng = Math.random)` pattern.
  Flag inline `Math.random()`/`Date.now()` calls inside physics or spawn logic
  that has no way to override them in a test.
- Flag scene/controller classes that inline collision, bounce, or particle
  physics math directly inside `update()`/render-loop callbacks instead of
  delegating to an extracted, testable module.
- Any class that owns an engine, scene, renderer, camera, or `window` event
  listener must expose a `dispose()`/teardown method that removes listeners
  and disposes engine/scene resources, following
  `BabylonCubeController.dispose()`. Flag any `addEventListener`,
  `runRenderLoop`, or engine/renderer creation that has no matching cleanup
  path, since it leaks listeners and GPU resources across remounts.

## Feature Checklist: Coordinate System & 3D Cube Rendering

- Coordinate-to-canvas conversions (origin offset, scale factor, Y-axis
  flip) should be easy to isolate and test independent of the actual
  `CanvasRenderingContext2D`/Babylon `Scene` calls.
- Canvas dimensions, grid scale, and axis length should be named constants or
  constructor options, not repeated literals.
- Rotation/scale/color setters on a 3D cube controller should validate or
  clamp their input (e.g. non-negative scale) rather than trusting caller
  input blindly.
- Resize handling must be re-bound/unbound correctly on `dispose()` so
  destroying one scene never leaves a stale `window.resize` listener touching
  a disposed engine.

## Feature Checklist: Cubes Exploding

- Cube spawn count must be clamped against a min/max (`clampMaxCubes`-style)
  before use; never let unbounded user input grow the cube/particle list
  without limit — that is both a correctness and a performance issue.
- Collision/bounce checks should operate on plain `{ x, y, z, halfExtent }`
  style data so they can be unit tested with fixed inputs, not by driving a
  live Babylon.js/Three.js scene.
- When a cube is removed (collision, explosion, cleanup), verify its
  geometry/material/mesh is disposed and removed from every tracking array
  (`cubes`, `particleSystems`, `explosions`), so long sessions do not leak
  GPU memory.
- Bounce/velocity negation should normalize `-0` to `0` (see
  `bounceVelocity`) so equality assertions and serialized state stay stable.

## Vitest Testing Guidelines

### Structure

- Colocate test files next to source (`Thing.js` + `Thing.test.js`), matching
  this repo's existing convention.
- Group related behavior with `describe`; use descriptive `it`/`test` names
  that state the expected behavior, not the method name alone.
- Reset spies/mocks in `beforeEach` (`vi.fn().mockClear()`), not by relying on
  test execution order, so tests stay isolated and can run in any order.
- Prefer `test.for`/`test.each` over copy-pasted `expect` blocks when the same
  assertion is repeated for multiple inputs (e.g. several clamp boundary
  values).

### Determinism & Async

- Because logic under test should accept an injectable `rng`/time source (see
  above), tests must pass a fixed deterministic function instead of relying
  on real `Math.random()`, so assertions are reproducible.
- Prefer `vi.useFakeTimers()`/`vi.waitFor(...)` over arbitrary
  `setTimeout`/sleep-based waits when testing render-loop or animation
  callbacks, to avoid flaky, slow tests.
- Drive render-loop/observable callbacks directly (invoke the captured
  callback, as the `BabylonCubeController` tests do via
  `addObservableSpy.callback()`) instead of waiting on real animation frames.

### Mocking 3D Engines (Babylon.js / Three.js)

- Use `vi.hoisted` to declare spies referenced inside `vi.mock('@babylonjs/core', ...)`
  or `vi.mock('three', ...)` factories, since `vi.mock` factories are hoisted
  above imports.
- Mock only the engine surface actually exercised (Engine, Scene, MeshBuilder,
  camera, etc.) rather than the whole library, and keep mock classes minimal
  so tests fail loudly when new engine APIs are used without an updated mock.
- Know the difference and use the right one: `mockClear()` (clears call
  history, keeps implementation), `mockReset()` (clears history and
  implementation), `mockRestore()` (restores the original, spy-only). Prefer
  `mockClear()` in `beforeEach` for hoisted spies that must keep their fake
  implementation across tests.
- Assert on both call arguments/counts (`toHaveBeenCalledWith`,
  `toHaveBeenCalledTimes`) and resulting object state (e.g.
  `controller.cube.rotation.z`) — do not test the mock in isolation from the
  behavior it enables.

### Coverage

- This project runs `vitest run --coverage` with the V8 provider
  (`@vitest/coverage-v8`). Do not add tests that only exercise mocks/spies
  without also asserting real state — that inflates coverage without
  verifying behavior.
- Remember `test.include` (which test files run) and `coverage.include`
  (which source files are measured) are different settings; adding a test
  file does not by itself guarantee the source file it targets is measured
  correctly if coverage include globs are ever introduced/changed.
- New pure functions extracted per the SRP guidance above (math, clamping,
  collision) are cheap to cover at close to 100% — prefer exhaustive
  boundary-value tests (min, max, NaN, zero) for these, following
  `cubesExplodingMath.test.js`.

## Out of Scope for This File

Do not raise comments here about: `src/claude-sonnet-4.6/**`, shared UI in
`src/components/**` or `src/pages/**`, build config (`vite.config.js`), or
naming/formatting differences between the three model folders that stem from
them being separate, independently generated solutions rather than a shared
codebase.
