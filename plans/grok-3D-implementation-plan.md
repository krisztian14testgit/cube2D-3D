## 3D Implementation Plan: Grok4.5 - 3D cube

### Goal
Implement a new **menu7** page that renders a Babylon.js 3D coordinate system with color-coded axes and lets the user create and transform a cube on the same canvas.

### Scope
- Add a new navigation entry for **menu7** named **Grok4.5 - 3D cube**
- Keep existing 2D coordinate-system and square-drawing features unchanged
- Keep existing menu1–menu6 features unchanged
- Implement the new feature only under `src/grok-4.5`

### Functional Requirements
1. **3D Coordinate System**
   - Render a 3D scene in one canvas using Babylon.js (`@babylonjs/core`)
   - Show 3 axes:
     - X axis: red
     - Y axis: green
     - Z axis: blue
   - Use ArcRotateCamera and hemispheric lighting suitable for local Vite client use

2. **Cube Creation**
   - A cube is created when the user clicks inside the 3D canvas
   - Only one interactive cube is created (subsequent clicks are no-ops for creation)
   - The same canvas continues to display both coordinate-system and cube

3. **Control Menu**
   - Control panel appears beside the canvas
   - Controls become usable only after cube creation
   - Controls must include:
     - Scale
     - Rotate axis selector (X / Y / Z)
     - Rotation speed
     - Cube surface color (default: light blue `#87cefa`)

4. **Rotation Behavior**
   - Cube continuously rotates around the selected axis
   - Rotation speed is adjustable live through the control panel
   - Axis selection is mutually exclusive (one axis at a time)

5. **Attribution**
   - Display “Created by Grok 4.5” on the page

### Architecture Plan
1. **`src/grok-4.5/features/cube-3d/BabylonCubeController.js`**
   - Scene/engine/camera/light setup
   - Axis mesh creation (RGB axes)
   - Cube creation and transform APIs (`createCubeIfMissing`, `setCubeScale`, `setRotationAxis`, `setRotationSpeed`, `setCubeColor`)
   - Render-loop rotation updates driven by delta time
   - Resource cleanup (`dispose`) including resize listener removal

2. **`src/grok-4.5/features/cube-3d/render3DCubePage.js`**
   - HTML markup generation for the 3D canvas + controls
   - Binding UI events to controller APIs
   - Enabling controls only after cube creation
   - Injected `controllerFactory` for unit-testability
   - `cleanup()` for listener and engine teardown

3. **`src/pages/menu7.js`**
   - Host the Grok 4.5 3D cube feature
   - Unique DOM ids for menu7 controls/canvas

4. **`src/components/Menu.js`**
   - Register `menu7` route
   - Label navigation item **Grok4.5 - 3D cube**

### File Layout
```
plans/grok-3D-implementation-plan.md
src/grok-4.5/features/cube-3d/BabylonCubeController.js
src/grok-4.5/features/cube-3d/render3DCubePage.js
src/grok-4.5/features/cube-3d/render3DCubePage.test.js
src/pages/menu7.js
src/pages/menu7.test.js
src/components/Menu.js   (route registration only)
```

### Test Plan
1. Unit tests for the 3D page/interactions (`render3DCubePage.test.js`):
   - Initial disabled controls
   - Cube creation triggered by canvas click
   - Scale/axis/speed/color events forwarded to controller
   - Cleanup disposes controller
   - Missing canvas throws a clear error
2. Unit tests for menu wiring (`menu7.test.js`):
   - Renders the Grok 3D feature into the container
   - Cleanup delegates to feature cleanup
3. Run project validation commands:
   - `npm run build`
   - `npm test`

### Technical Constraints
- Vanilla JavaScript ES2022 modules
- Client-only Vite application
- Vitest + jsdom for tests
- Clean code / SOLID: single-responsibility modules, dependency injection for controller factory
- Babylon.js is already installed; do not reinstall or pin a new version unless required
- Do not modify existing 2D coordinate systems or other LLM feature folders

### Extra Focus Topics
- Prefer small pure helpers for markup and control enablement
- Safe defaults and no-op transform APIs when cube is not yet created
- Avoid leaking global listeners on navigation away from menu7
- Keep CSS reuse via existing `.canvas-container` / `.manipulations` styles
- Mirror proven patterns from `src/gpt5.3-codex/features/cube-3d` while keeping Grok code isolated under `src/grok-4.5`
