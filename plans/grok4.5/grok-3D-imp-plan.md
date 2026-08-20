# Grok4.5 - 3D Babylon.js Cube Implementation Plan

## Goal
Implement **menu7** (`Grok4.5 - 3D babylonjs`) that renders a Babylon.js 3D coordinate system with color-coded axes and lets the user create and transform a cube on the same canvas.

## Workplace analysis (`src/grok4.5/features`)
- Folder does not exist yet; create feature modules under this path only.
- Do **not** modify existing 2D coordinate-system / bouncing-square features of other LLMs.
- Reuse project patterns from other menu pages (markup + controller + page renderer + Vitest).

## Functional requirements
1. **Menu integration**
   - Register route `menu7` in `src/components/Menu.js`.
   - Label: **Grok4.5 - 3D babylonjs**.
   - Page entry: `src/pages/menu7.js`.

2. **3D coordinate system (same canvas as cube)**
   - Babylon.js engine/scene/camera/light.
   - Axes:
     - X: red
     - Y: green
     - Z: blue

3. **Cube creation**
   - Left-click (or canvas click) creates one cube if missing.
   - Default surface color: light blue (`#87cefa`).

4. **Control panel (beside canvas)**
   - Enabled only after cube exists.
   - Controls:
     - Scale
     - Rotate axis (`x` | `y` | `z`)
     - Rotation speed
     - Cube color

5. **Rotation behavior**
   - Continuous spin around the selected axis at the configured speed.

## Architecture
| Module | Responsibility |
|--------|----------------|
| `src/grok4.5/features/cube-3d/BabylonCubeController.js` | Scene setup, axes, cube APIs, render loop, dispose |
| `src/grok4.5/features/cube-3d/render3DCubePage.js` | Markup, control binding, enable-after-create |
| `src/pages/menu7.js` | Host cube feature (and later exploding section) |
| `src/components/Menu.js` | Route + nav label for menu7 |

## Test plan
- Controls start disabled; click creates cube and enables controls.
- Scale / axis / speed / color updates call controller methods.
- Cleanup disposes controller.
- Run `npm test` and `npm run build`.

## Technical constraints
- Vanilla ES2022, Vite, Vitest, `@babylonjs/core`.
- Clean code / SOLID: small single-purpose modules.
- Safe no-ops when cube is not created yet.
