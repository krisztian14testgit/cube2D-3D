# GPT-5.3-Codex - 3D Cubes Exploding Implementation Plan

## Current status analysis (`src/gpt5.3-codex/features`)
- ✅ Step 1 exists: 2D coordinate system rendering (`coordinate-system/*`).
- ✅ Step 2 exists: 2D bouncing/rotating square simulation with collision removal (`bouncing-squares/*`).
- ❌ Missing in GPT-5.3-Codex area: dedicated 3D cube scene, sphere boundary container, configurable limits, explosion animation, and 3D camera controls.

## Goal
Add a BabylonJS-based 3D feature under **"GPT5.3-codex - 3D cube"** where cubes spawn inside a transparent bordered sphere, move and rotate randomly, bounce from the spherical boundary, and explode/disappear when colliding.

## Functional scope
1. **UI / Menu integration**
   - Add a new top-level menu item: `GPT5.3-codex - 3D cube`.
   - Render the new feature in its own page and place the exploding section under a previous section header, separated with an `hr` divider.

2. **Sphere boundary container**
   - Render a transparent sphere and wireframe border lines.
   - Add sphere scale control with default value `8`.

3. **Cube spawning & lifecycle**
   - Left-click inside sphere spawns one cube.
   - Each cube gets random scale in `[1, 5]` and random rotation on `(x, y, z)`.
   - Keep indexed cube list and enforce configurable max cube limit.

4. **Collision and explosion behavior**
   - Detect cube encounters by pairwise collision checks.
   - Collect encountered cube indexes, remove them from highest index to lowest.
   - Trigger BabylonJS particle explosion effect when cubes are removed.

5. **Boundary bounce behavior**
   - When a cube reaches the sphere boundary and is moving outward, reverse direction (multiply velocity by `-1`).

6. **Controls and constraints**
   - Control panel fields:
     - Sphere scale (initial `8`).
     - Max cubes number (`min 10`, `max 100`, default `10`).
   - Clamp max cube value inside valid bounds.

7. **Camera interactions**
   - Use rotational camera around sphere.
   - Right mouse drag rotates camera.
   - Mouse wheel zooms in/out.

## Quality and validation
- Add Vitest unit tests for pure feature logic:
  - Max-cube clamping.
  - Randomized cube state bounds.
  - Collision index collection/removal targeting.
  - Sphere-boundary bounce decision.
- Add UI markup test coverage for required controls/menu content.
- Run `npm run build` and `npm test`.
- Update package version to `1.5.1`.
