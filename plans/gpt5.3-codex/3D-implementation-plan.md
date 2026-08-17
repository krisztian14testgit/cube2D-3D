## 3D Implementation Plan: GPT5.3-codex - 3D cube

### Goal
Implement a new **menu6** page that renders a Babylon.js 3D coordinate system with color-coded axes and lets the user create and transform a cube on the same canvas.

### Scope
- Add a new navigation entry for **menu6** named **GPT5.3-codex - 3D cube**
- Keep existing 2D coordinate-system and square-drawing features unchanged
- Implement the new feature only under `src/gpt5.3-codex`

### Functional Requirements
1. **3D Coordinate System**
   - Render a 3D scene in one canvas using Babylon.js
   - Show 3 axes:
     - X axis: red
     - Y axis: green
     - Z axis: blue

2. **Cube Creation**
   - A cube is created when the user clicks inside the 3D canvas
   - The same canvas continues to display both coordinate-system and cube

3. **Control Menu**
   - Control panel appears beside the canvas and becomes usable after cube creation
   - Controls must include:
     - Scale
     - Rotate axis selector (X / Y / Z)
     - Rotation speed
     - Cube surface color (default: light blue)

4. **Rotation Behavior**
   - Cube continuously rotates around the selected axis
   - Rotation speed is adjustable live through the control panel

### Architecture Plan
1. Create a Babylon-specific controller module responsible for:
   - Scene/engine/camera/light setup
   - Axis mesh creation
   - Cube creation and transform APIs
   - Render-loop rotation updates
   - Resource cleanup
2. Create a page-rendering module responsible for:
   - HTML markup generation for the 3D canvas + controls
   - Binding UI events to controller APIs
   - Enabling controls only after cube creation
3. Create `menu6` page wiring to host the new feature
4. Register `menu6` in the main menu component and label it correctly

### Test Plan
1. Add unit tests for the 3D page/interactions:
   - Initial disabled controls
   - Cube creation triggered by canvas click
   - Scale/axis/speed/color events forwarded to controller
   - Cleanup disposes controller
2. Run project validation commands:
   - `npm run build`
   - `npm test`

### Extra Focus Topics
- Keep modules small and single-purpose (SOLID-friendly separation)
- Avoid introducing side effects to existing menu pages
- Ensure safe defaults and graceful no-op behavior when cube is not yet created
