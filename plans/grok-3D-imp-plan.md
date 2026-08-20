# Implementation Plan: Grok4.5 - 3D babylonjs

## Goal
Implement a new **menu7** page that renders a Babylon.js 3D coordinate system with color-coded axes and lets the user create and transform a cube on the same canvas.

## Scope
- Add a new navigation entry for **menu7** named **Grok4.5 - 3D babylonjs**
- Keep existing 2D coordinate-system and square-drawing features unchanged
- Keep existing menu1–menu6 pages unchanged
- Implement the new feature only under `src/grok4.5/features`
- Reuse project stack: Vanilla JS (ES2022), Vite, Vitest, `@babylonjs/core`

## Functional Requirements

### 1. 3D Coordinate System
- Render a 3D scene in one canvas using Babylon.js
- Show 3 axes on the same canvas:
  - **X axis**: red
  - **Y axis**: green
  - **Z axis**: blue

### 2. Cube Creation
- When the user clicks inside the 3D coordinate-system canvas, draw a cube
- The same canvas continues to display both the coordinate system and the cube
- Only one interactive cube is created (subsequent clicks are no-ops for creation)
- Default cube surface color: light blue (`#87cefa`)

### 3. Control Menu
- Control panel appears beside the canvas
- Controls become usable after cube creation
- Controls must include:
  - **Scale** (live slider)
  - **Rotate axis** selector with 3 options: X / Y / Z
  - **Rotation speed** (live slider)
  - **Cube surface color** (color picker, default light blue)

### 4. Rotation Behavior
- Cube continuously rotates around the selected axis
- Rotation speed is adjustable live through the control panel
- Axis selection is adjustable live

## Architecture Plan

### Directory layout
```
src/grok4.5/features/cube-3d/
  BabylonCubeController.js   # Babylon scene/engine/cube APIs
  render3DCubePage.js        # Markup + UI event wiring
  render3DCubePage.test.js   # Unit tests (mocked controller)
src/pages/menu7.js           # Page entry for menu7
src/pages/menu7.test.js      # Menu7 wiring tests
```

### Module responsibilities

1. **`BabylonCubeController.js`**
   - Scene / engine / camera / light setup
   - Axis mesh creation (RGB X/Y/Z)
   - Cube creation and transform APIs:
     - `createCubeIfMissing()`
     - `setCubeScale(scale)`
     - `setRotationAxis(axis)`
     - `setRotationSpeed(speed)`
     - `setCubeColor(colorHex)`
   - Render-loop rotation updates based on selected axis + speed
   - Window resize handling
   - `dispose()` for cleanup
   - Factory: `createBabylonCubeController(canvas, options)`

2. **`render3DCubePage.js`**
   - HTML markup for canvas + control panel
   - Bind UI events to controller APIs
   - Enable controls only after cube creation
   - Return `{ canvas, controller, cleanup }`
   - Accept injectable `controllerFactory` for unit tests

3. **`menu7.js`**
   - Host the feature page with menu7-specific element IDs
   - Title / created-by labels for Grok4.5

4. **Menu integration (`src/components/Menu.js`)**
   - Register `menu7` route
   - Add nav link labeled **Grok4.5 - 3D babylonjs**

## UI Defaults
| Control        | Default   | Range / options      |
|----------------|-----------|----------------------|
| Scale          | 1         | 0.5 – 3 (step 0.1)   |
| Rotate axis    | Y         | X, Y, Z              |
| Rotation speed | 1         | 0 – 6 (step 0.1)     |
| Cube color     | `#87cefa` | color input          |

## Development Steps
1. Write this plan file under `/plans/grok-3D-imp-plan.md`
2. Implement `BabylonCubeController.js` with axes, cube, transforms, dispose
3. Implement `render3DCubePage.js` markup + interactions
4. Add `menu7.js` page wiring
5. Register menu7 in `Menu.js`
6. Add unit tests for page interactions and menu wiring
7. Run `npm test` and `npm run build`
8. Open PR from the feature branch based on `develop`

## Test Plan
1. **`render3DCubePage.test.js`**
   - Controls start disabled
   - Canvas click creates cube and enables controls
   - Scale / axis / speed / color events forward to controller
   - Cleanup disposes controller
   - Missing canvas throws a clear error
2. **`menu7.test.js`**
   - Renders the 3D cube feature with expected options
   - Cleanup delegates to feature cleanup
3. Project validation:
   - `npm test`
   - `npm run build`

## SOLID / Clean Code Notes
- Single-responsibility modules (controller vs page vs menu route)
- Dependency injection of `controllerFactory` for testability
- No side effects on existing 2D/3D menu pages
- Graceful no-ops when cube is not yet created
- Safe dispose of engine and event listeners

## References
- Existing Babylon implementation pattern: `src/gpt5.3-codex/features/cube-3d/`
- Babylon.js + Vite: https://doc.babylonjs.com/guidedLearning/usingVite/
- Babylon GUI docs (reference): https://doc.babylonjs.com/features/featuresDeepDive/gui/gui3D/
