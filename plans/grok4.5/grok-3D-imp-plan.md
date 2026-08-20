# 3D Implementation Plan: Grok4.5 - 3D babylonjs

## Goal
Implement a new **menu7** page that renders a Babylon.js 3D coordinate system with color-coded axes and lets the user create and transform a cube on the same canvas.

## Scope
- Add a new navigation entry for **menu7** named **Grok4.5 - 3D babylonjs**
- Keep existing 2D coordinate-system and square-drawing features unchanged
- Implement the new feature only under `src/grok4.5/features`
- Work on branch `grok-cube3d-2` (from develop lineage)

## Functional Requirements
1. **3D Coordinate System**
   - Render a 3D scene in one canvas using Babylon.js (`@babylonjs/core`)
   - Show 3 axes on the same canvas:
     - X axis: red
     - Y axis: green
     - Z axis: blue

2. **Cube Creation**
   - A cube is created when the user clicks inside the 3D canvas
   - The same canvas continues to display both the coordinate system and the cube
   - Default cube surface color: light blue (`#87cefa`)
   - Only one cube is created (subsequent clicks do not spawn extra cubes)

3. **Control Menu**
   - Control panel appears beside the canvas
   - Controls become usable after cube creation
   - Controls must include:
     - Scale
     - Rotate axis selector (X / Y / Z)
     - Rotation speed
     - Cube surface color

4. **Rotation Behavior**
   - Cube continuously rotates around the selected axis
   - Rotation speed is adjustable live through the control panel

## Technical Stack
- Vanilla JavaScript (ES2022)
- Vite client app
- Babylon.js (`@babylonjs/core`)
- Vitest unit tests
- Clean code and SOLID module boundaries

## Directory Structure
```
plans/grok-3D-imp-plan.md
src/grok4.5/features/cube-3d/
  BabylonCubeController.js
  BabylonCubeController.test.js
  render3DCubePage.js
  render3DCubePage.test.js
src/pages/menu7.js
src/pages/menu7.test.js
```

## Architecture
1. **`BabylonCubeController`** (single responsibility: Babylon scene lifecycle)
   - Engine / scene / camera / light setup
   - Axis mesh creation (RGB)
   - Cube creation and transform APIs (`scale`, `rotation axis`, `speed`, `color`)
   - Render-loop rotation updates
   - Resize handling and dispose/cleanup

2. **`render3DCubePage`** (single responsibility: page UI + event wiring)
   - Markup for canvas + control panel
   - Bind UI events to controller APIs
   - Enable controls only after cube creation
   - Return a cleanup function for navigation safety

3. **`menu7` page wiring**
   - Host the Grok feature page
   - Keep menu IDs isolated (`menu7` prefixes)

4. **`Menu` registration**
   - Register route `menu7`
   - Label: **Grok4.5 - 3D babylonjs**

## Development Steps
1. Create this plan file in `/plans`
2. Add `BabylonCubeController` under `src/grok4.5/features/cube-3d`
3. Add `render3DCubePage` UI/interaction module
4. Wire `src/pages/menu7.js` and register it in `src/components/Menu.js`
5. Add Vitest coverage for controller defaults/APIs and page interactions
6. Validate with:
   - `npm test`
   - `npm run build`

## Test Plan
1. Controller unit tests:
   - Default options
   - No-op transform APIs before cube exists
   - Scale / axis / speed / color updates after cube creation
   - Dispose removes resize listener and engine
2. Page interaction tests (mock controller factory):
   - Controls disabled initially
   - Canvas click creates cube and enables controls
   - Scale / axis / speed / color events forwarded
   - Cleanup disposes controller
3. Menu7 wiring test:
   - `renderMenu7` delegates to Grok page renderer

## Extra Notes
- Prefer dependency injection (`controllerFactory`) so UI tests avoid real WebGL
- Do not modify existing 2D features or other LLM folders except menu registration
- Follow Vite + Babylon usage patterns from Babylon docs (ESM imports via `@babylonjs/core`)
