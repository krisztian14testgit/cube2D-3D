# Grok 4.5 - 3D Cubes Exploding Implementation Plan

## Current status analysis (`src/grok-4.5/features`)
- ✅ Existing: Grok 4.5 3D cube page wrapper (`cube-3d/render3DCubePage.js`) reusing shared Babylon cube controls.
- ✅ Existing: `menu7` route labeled **Grok4.5 - 3D cube** with unit tests for wiring and menu navigation.
- ❌ Missing: sphere boundary container, multi-cube spawn lifecycle, collision explosion, boundary bounce, and control panel for sphere/max-cube settings under Grok workspace.

## Goal
Add a BabylonJS-based exploding cubes feature under **Grok4.5 - 3D cube** (`menu7`). Cubes spawn inside a transparent bordered sphere, move and rotate randomly, bounce from the spherical boundary, and explode/disappear on collision. Place the feature below the existing Grok cube section, separated by a divider and its own header.

## Functional scope
1. **UI / Menu integration**
   - Keep top-level menu item: `Grok4.5 - 3D cube`.
   - Update `menu7` to render:
     1. Existing Grok 3D cube section.
     2. Divider (`hr` / border separator).
     3. New exploding-cubes section with its own header title.
   - Work only under `src/grok-4.5/features` (plus thin `src/pages/menu7.js` wiring and tests).

2. **Sphere boundary container**
   - Render a transparent sphere with wireframe border lines on the surface.
   - Sphere scale control initial value: `8`.

3. **Cube spawning & lifecycle**
   - Left-click inside the sphere spawns one cube.
   - Each cube gets random scale in `[1, 5]` and random rotation velocity on `(x, y, z)`.
   - Maintain an indexed cube list; enforce configurable max cube limit (default `10`).

4. **Collision and explosion behavior**
   - Detect cube encounters with pairwise collision checks.
   - Collect encountered cube indexes and remove from highest index to lowest.
   - Trigger BabylonJS particle explosion animation when cubes are removed.

5. **Boundary bounce behavior**
   - When a cube reaches the sphere boundary while moving outward, reverse direction (`velocity *= -1`).

6. **Controls and constraints**
   - Control panel fields:
     - Sphere scale (initial `8`).
     - Max cubes number (`min 10`, `max 100`, default `10`).
   - Clamp max cube value inside valid bounds.

7. **Camera interactions**
   - Arc-rotate camera around the sphere.
   - Right mouse drag rotates the camera.
   - Mouse wheel zooms in/out.

## Implementation modules (`src/grok-4.5/features/cubes-exploding/`)
1. `CubesExplodingPhysics.js` — pure helpers:
   - `clampMaxCubeCount`
   - `createRandomCubeState`
   - `collectCollisionIndexes`
   - `shouldBounceFromBoundary`
2. `CubesExplodingScene.js` — Babylon scene orchestration (sphere, cubes, camera, explosions, dispose).
3. `renderCubesExplodingMenuPage.js` — markup + scene bootstrap/bind controls.
4. Matching `*.test.js` coverage for physics, scene construction defaults, markup/controls, and `menu7` integration.

## Development steps
1. Create this plan under `plans/`.
2. Implement pure physics helpers and unit tests.
3. Implement Babylon scene + page renderer with Grok-specific element IDs.
4. Wire `menu7` to stack cube section + divider + exploding section; return combined cleanup.
5. Extend `menu7` / feature tests.
6. Bump package version if needed for the feature release.
7. Validate with `npm run build` and `npm test`.

## Quality and validation
- Vitest unit tests for:
  - Max-cube clamping.
  - Randomized cube state bounds.
  - Collision index collection/removal order.
  - Sphere-boundary bounce decision.
  - Required control panel markup.
  - `menu7` dual-section layout and cleanup.
- Follow clean code and SOLID (separate pure physics from scene/UI).
- Do not modify Gemini feature folders for this work.
- Prefer Grok-local implementations under `src/grok-4.5/features` rather than coupling to GPT exploding modules.

## Technical stacks
- BabylonJS (`@babylonjs/core`) for 3D scene, camera, particles.
- Vitest + jsdom for unit tests.
- ES modules / modern JavaScript.

## Extra focus topics
- Prevent resource leaks: dispose engine/scene, observers, listeners, explosion timers.
- Isolate DOM IDs with a `grok-` prefix so menu6/menu7 do not clash.
- Keep right-click camera rotation free of browser context menu interference.
- Ensure left-click spawn only hits the sphere surface (not UI controls).
