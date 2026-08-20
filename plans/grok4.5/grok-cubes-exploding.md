# Grok4.5 - 3D Cubes Exploding Implementation Plan

## Current status analysis (`src/grok4.5/features`)
- 3D cube + axes feature lives under `cube-3d/` (menu7 first section).
- Missing: sphere boundary container, multi-cube spawn, collision explosions, camera controls, configurable limits.

## Goal
Add a Babylon.js exploding-cubes scene under **Grok4.5 - 3D babylonjs** (`menu7`), placed **below** the interactive cube section, separated by a divider and its own header.

## Functional scope
1. **UI / menu integration**
   - Feature lives under menu7 (Grok4.5 - 3D babylonjs).
   - Second section under the cube feature with `hr`/border divider and header title.
   - Show “Created by Grok4.5” style attribution consistent with other pages when applicable.

2. **Sphere boundary container**
   - Huge transparent sphere with wireframe/border lines on the surface.
   - Control: sphere scale, **initial value `8`**.

3. **Cube spawning & lifecycle**
   - Left-click inside the sphere spawns a cube.
   - Random scale in `[1, 5]`.
   - Random continuous rotation on `(x, y, z)`.
   - Random travel velocity.
   - Indexed cube list for identification/removal.
   - Enforce max cube count from control panel.

4. **Collision and explosion**
   - Pairwise encounter detection.
   - Remove collided cubes by index (highest index first).
   - Play Babylon.js particle explosion, then dispose meshes.

5. **Boundary bounce**
   - When a cube reaches the sphere boundary while moving outward, reverse direction (`velocity *= -1`).

6. **Control panel**
   - Sphere scale (default `8`).
   - Max cubes number: min `10`, max `100` (default `10`), clamp invalid input.
   - Optional camera rotation speed for usability (consistent with other LLM implementations).

7. **Camera**
   - Arc-rotate camera around the sphere.
   - Right-click drag rotates.
   - Mouse wheel zooms in/out.
   - Prevent browser context menu on canvas.

## Architecture
| Module | Responsibility |
|--------|----------------|
| `src/grok4.5/features/cubes-exploding/CubesExplodingPhysics.js` | Pure logic: clamp max cubes, random cube state, collision indexes, boundary bounce |
| `src/grok4.5/features/cubes-exploding/CubesExplodingScene.js` | Babylon scene, sphere, spawn, motion, explode, camera, dispose |
| `src/grok4.5/features/cubes-exploding/renderCubesExplodingMenuPage.js` | Markup + bind controls + initialize scene |
| `src/pages/menu7.js` | Compose cube-3d section + exploding section with divider |

## Development steps
1. Create pure physics module + Vitest coverage.
2. Implement Babylon scene class with sphere, cubes, bounce, explode.
3. Implement menu page markup and control binding.
4. Wire into `menu7` below cube feature with divider.
5. Add page/scene unit tests (mock Babylon where needed).
6. Run `npm test` and `npm run build`; fix failures.
7. Keep existing 2D features and other LLM menus unchanged.

## Quality bar
- SOLID-friendly separation of pure physics vs rendering.
- Indexed removal order is deterministic (descending indexes).
- No leaked engines/scenes/timeouts on dispose.
- Coverage for clamp, random ranges, collisions, bounce, markup controls.

## Technical stacks
- Babylon.js (`@babylonjs/core`)
- ES2022 modules, Vite, Vitest + jsdom
- Clean code / SOLID
