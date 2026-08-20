# Grok4.5 - 3D Cubes Exploding Implementation Plan

## Current status analysis (`src/grok4.5/features`)
- ✅ Existing 3D cube feature under `cube-3d/`:
  - `BabylonCubeController.js` — Babylon engine/scene, RGB axes, single interactive cube, transform APIs, dispose.
  - `render3DCubePage.js` — page markup, control panel, click-to-create cube, cleanup.
  - Vitest coverage for controller and page interactions.
- ✅ Menu wiring:
  - `src/pages/menu7.js` hosts Grok page via `render3DCubePage`.
  - `Menu.js` route `menu7` labeled **Grok4.5 - 3D babylonjs**.
- ❌ Missing: sphere boundary container, multi-cube spawn with limits, random motion/rotation, sphere bounce, cube-cube collision + explosion, stacked UI section under the existing Grok 3D feature.

## Goal
Add a Babylon.js feature under the existing **Grok4.5 - 3D babylonjs** menu page: a transparent wireframe sphere boundary. Left-click spawns randomly scaled/rotating cubes (configurable max). Cubes bounce off the sphere; when they collide they explode (particle effect) and are removed by index. Camera: ArcRotateCamera — right-drag orbit, wheel zoom.

## Functional requirements
1. **UI / Menu integration**
   - Keep route `menu7` and label **Grok4.5 - 3D babylonjs**.
   - On the same page, place the exploding-cubes section **below** the existing single-cube feature.
   - Separate sections with an `hr` divider and a dedicated header title (e.g. **Grok4.5 - Cubes exploding**).

2. **Sphere boundary container**
   - Huge transparent sphere with border/wireframe lines on the surface.
   - Control panel: sphere scale, initial value `8`.

3. **Cube spawning & lifecycle**
   - Left-click inside the sphere spawns one cube (pick against sphere mesh).
   - Random scale in `[1, 5]`.
   - Random continuous rotation on `(x, y, z)`.
   - Random linear velocity for movement.
   - Indexed cube list; enforce max cube count.
   - Max cubes control: min `10`, max `100`, default `10`.

4. **Collision and explosion**
   - Pairwise collision checks each frame (sphere-approx using half-diagonal / Math.hypot — avoid relying on `Vector3.distanceTo`).
   - Collect colliding indexes; remove highest index first to keep list stable.
   - Play Babylon particle explosion at collision positions; dispose collided cube meshes.

5. **Boundary bounce**
   - When a cube reaches the sphere inner surface and is moving outward, reverse velocity direction (`velocity *= -1` / negate).

6. **Camera**
   - `ArcRotateCamera` centered on sphere origin.
   - Right mouse button rotates around the sphere.
   - Mouse wheel zooms in/out.
   - Left click reserved for spawning (do not use left-drag for camera pan/rotate).

7. **Control panel (exploding section)**
   - Sphere scale (default `8`).
   - Max cubes number (`10`–`100`, default `10`).
   - Status text: active cube count / max.

## Technical stack
- Vanilla JS (ES2022 modules)
- Babylon.js (`@babylonjs/core`) — Engine, Scene, ArcRotateCamera, MeshBuilder, StandardMaterial, ParticleSystem / GPU-friendly simple particles
- Vitest + jsdom
- Clean code + SOLID module boundaries
- Work only under `src/grok4.5/features` (+ menu7 / Menu registration if needed)
- Do not modify other LLM feature folders

## Directory structure
```
plans/grok4.5/grok-cubes-exploding.md
src/grok4.5/features/cubes-exploding/
  cubesExplodingMath.js          # pure helpers: clamp, random scale/velocity, collision indexes, bounce
  cubesExplodingMath.test.js
  BabylonCubesExplodingController.js
  BabylonCubesExplodingController.test.js
  renderCubesExplodingSection.js
  renderCubesExplodingSection.test.js
src/grok4.5/features/cube-3d/
  render3DCubePage.js            # extended: append divider + exploding section, combined cleanup
  render3DCubePage.test.js       # extended coverage
src/pages/menu7.js               # unchanged host if page renderer already stacks sections
src/pages/menu7.test.js          # keep / extend if needed
```

## Architecture (SOLID)
1. **`cubesExplodingMath`** — pure functions, no Babylon dependency  
   - `clampMaxCubes(value, min=10, max=100)`  
   - `randomCubeScale(min=1, max=5, rng=Math.random)`  
   - `randomVelocity(rng)` / `randomRotationSpeed(rng)`  
   - `collectCollisionIndexes(cubes)` — each cube `{ x,y,z, halfExtent }`  
   - `sortIndexesDescending(indexes)`  
   - `shouldBounceOffSphere(position, velocity, sphereRadius, cubeHalfExtent)`  
   - `bounceVelocity(velocity)` → negated clone  

2. **`BabylonCubesExplodingController`** — scene lifecycle only  
   - Engine / scene / lights / ArcRotateCamera (right-button rotate, wheel zoom; left button disabled for camera)  
   - Transparent wireframe sphere; `setSphereScale(scale)`  
   - `setMaxCubes(n)` with clamp  
   - `trySpawnCubeAtScreen(clientX, clientY)` via scene picking on sphere  
   - Indexed internal cube records: `{ id/index, mesh, velocity, rotationSpeed, scale }`  
   - Frame update: move, rotate, bounce, collide → explode + remove by descending index  
   - Explosion: short-lived `ParticleSystem` (or small burst meshes) then dispose  
   - `dispose()` cleans listeners, particles, engine  

3. **`renderCubesExplodingSection`** — UI markup + wiring for the exploding block only  
   - Markup: header, canvas, sphere scale, max cubes, status  
   - DI: `controllerFactory` for tests  
   - Returns `{ cleanup }`  

4. **`render3DCubePage` integration**  
   - Keep existing single-cube UI  
   - Append `<hr>` + exploding section  
   - Combine cleanups from both features  

## Camera / input details (Babylon)
- Prefer `ArcRotateCamera` with:
  - `camera.attachControl(canvas, true)`
  - Disable left-button camera action (`camera.inputs.attached.pointers.buttons` or equivalent so LMB does not orbit)
  - RMB = rotate, wheel = zoom
- Spawn on `pointerdown` / click with `event.button === 0` and pick sphere mesh; ignore when over UI controls.

## Development steps
1. ✅ Create this plan under `plans/grok4.5/grok-cubes-exploding.md`.
2. Implement pure math module + unit tests.
3. Implement `BabylonCubesExplodingController` + unit tests (mock `@babylonjs/core`).
4. Implement `renderCubesExplodingSection` + interaction tests.
5. Extend `render3DCubePage` to stack previous feature + divider + exploding section; update tests.
6. Ensure `menu7` still delegates to the page renderer; adjust tests if needed.
7. Run validation:
   - `npm test`
   - `npm run build`
8. Bump package version patch if tests/build pass (e.g. `1.6.0` → `1.6.1`).

## Test plan
1. **Math**
   - Clamp max cubes to `[10, 100]`
   - Random scale always in `[1, 5]`
   - Collision index pairs collected; descending sort stable for removal
   - Bounce only when outside/at boundary and moving outward; velocity negated
2. **Controller**
   - Defaults: sphere scale 8, max cubes 10
   - Respect max cubes (no spawn beyond limit)
   - `setSphereScale` / `setMaxCubes` update state
   - Collision path removes meshes and triggers explosion helper
   - Dispose removes resize listener and disposes engine
3. **Section / page UI**
   - Markup contains divider, exploding header, sphere scale + max cubes controls
   - Control events forward to controller
   - Combined cleanup disposes both controllers
4. **Regression**
   - Existing cube-3d controller/page tests still pass

## Extra development focus
- Prefer pure math extraction so collision/bounce tests never need WebGL.
- Store bound event handlers in private fields (do not reassign private methods).
- Use `Math.hypot` or `BABYLON.Vector3.Distance` for distances (not `distanceTo`).
- Keep feature isolated: no edits under `gemini*`, `gpt*`, or `claude*` feature trees.
- Particle explosion should be lightweight and always disposed to avoid leaks.
- When sphere scale shrinks, optionally push cubes inward or let next frame bounce handle overflow.

## Acceptance checklist
- [x] Plan file present
- [x] Exploding section visible under existing Grok 3D cube UI with `hr` + header
- [x] Transparent wireframe sphere, default scale 8
- [x] LMB spawn, random scale 1–5, random XYZ rotation + motion
- [x] Max cubes configurable 10–100
- [x] Sphere bounce reverses outward velocity
- [x] Collisions explode + remove by descending indexes
- [x] RMB orbit + wheel zoom
- [x] Vitest coverage for math, controller, UI
- [x] `npm test` and `npm run build` green
