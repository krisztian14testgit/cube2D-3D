# Plan: Step 4 Three.js 3D Cube In Coordinate System

**Scope**
- Implement a new `menu5` page labeled `LLM - 3D cube`.
- Keep the existing 2D coordinate-system features unchanged.
- Use only `three.js` for the 3D solution. Do not add BabylonJS-based code.

**Goal**
- Render a 3D coordinate-system with three visible axes on a single canvas.
- Axis colors must be `X = red`, `Y = green`, `Z = blue`.
- When the user clicks inside the 3D coordinate-system, create one cube in that same canvas.
- After the cube exists, show a control menu beside the canvas for scale, rotation axis, rotation speed, and cube face colors.
- Default cube color should be light blue.

**Technical Constraints**
- Language: Vanilla JavaScript `ES2022`
- Runtime: local client application with Vite
- Rendering library: `three`
- Tests: `vitest` with `jsdom`
- Style: clean code and SOLID-oriented separation of responsibilities

**Implementation Strategy**
- Reuse the current menu-routing structure instead of rewriting the application shell.
- Add the 3D feature as a new isolated slice under the existing `gpt5.3-codex/features` area, because the current `menu4` coordinate-system implementation already follows that pattern.
- Keep rendering, scene state, cube state, and UI wiring separated so the animation logic does not leak into the page renderer.

**Planned Files**
- Update `package.json`
  - Add the `three` dependency.
- Update `src/components/Menu.js`
  - Register `menu5`.
  - Rename the new menu item label to `LLM - 3D cube`.
- Add `src/pages/menu5.js`
  - Entry page for the new 3D feature.
- Add `src/gpt5.3-codex/features/threejs-cube/renderThreeCubeMenuPage.js`
  - Builds the page markup and wires DOM events.
- Add `src/gpt5.3-codex/features/threejs-cube/ThreeCubeScene.js`
  - Owns Three.js scene setup, render loop, resize handling, click-to-create behavior, and disposal.
- Add `src/gpt5.3-codex/features/threejs-cube/CubeController.js`
  - Applies scale, rotation axis, rotation speed, and face-color updates to the active cube.
- Add `src/gpt5.3-codex/features/threejs-cube/CubeState.js`
  - Holds feature state in a small focused model object.
- Add `src/gpt5.3-codex/features/threejs-cube/renderThreeCubeMenuPage.test.js`
  - Verifies menu markup and UI state transitions.
- Add `src/gpt5.3-codex/features/threejs-cube/ThreeCubeScene.test.js`
  - Verifies scene-level orchestration through mocked Three.js collaborators.
- Optionally add `src/gpt5.3-codex/features/threejs-cube/CubeController.test.js`
  - Verifies transform and color updates without DOM coupling.

**Feature Architecture**
1. `menu5.js`
   - Minimal page entry point.
   - Delegates all rendering to `renderThreeCubeMenuPage(container)`.

2. `renderThreeCubeMenuPage.js`
   - Renders:
     - page title
     - one canvas for the 3D scene
     - a side control panel
     - a short helper text such as `Click inside the 3D coordinate-system to create the cube`
   - Keeps controls disabled or hidden until the first cube is created.
   - Creates the scene instance and binds UI events to the controller.

3. `ThreeCubeScene.js`
   - Creates and owns:
     - `THREE.Scene`
     - `THREE.PerspectiveCamera`
     - `THREE.WebGLRenderer`
     - base lighting
     - `THREE.AxesHelper`
     - optional neutral helper grid or plane for depth orientation
     - `THREE.Raycaster`
   - Starts a requestAnimationFrame loop.
   - Exposes methods such as:
     - `initialize()`
     - `createCubeAtPointer(event)`
     - `setCubeScale(scale)`
     - `setRotationAxis(axis)`
     - `setRotationSpeed(speed)`
     - `setFaceColor(faceIndex, color)`
     - `dispose()`

4. `CubeController.js`
   - Coordinates between UI inputs and scene mutations.
   - Prevents invalid updates before a cube exists.
   - Centralizes cube transform rules so DOM code stays thin.

5. `CubeState.js`
   - Stores the current state in one place:
     - `hasCube`
     - `scale`
     - `rotationAxis` with values `x | y | z`
     - `rotationSpeed`
     - `faceColors[6]`
   - Starts with default values that the controller and tests can share.

**Three.js Design Details**
- Scene setup:
  - Use `THREE.Scene` with a simple neutral background.
  - Use `THREE.PerspectiveCamera` positioned diagonally so all three axes are visible.
  - Use `THREE.WebGLRenderer` bound directly to the page canvas.
  - Set `antialias: true` and device-pixel-ratio limits for a clean local experience.

- Coordinate-system rendering:
  - Use `THREE.AxesHelper(size)` as the base axis visualizer.
  - Explicitly call `axesHelper.setColors('red', 'green', 'blue')` so the requirement is fixed in code.
  - Optionally add a subtle `THREE.GridHelper` or a transparent interaction plane, but keep the visible emphasis on the three axes.

- Cube rendering:
  - Use `THREE.BoxGeometry(1, 1, 1)`.
  - Use six materials, one for each face, so the control menu can change surface-side colors independently.
  - Initialize all six materials to the same light-blue default.
  - Wrap the cube in a `THREE.Mesh` and store a direct reference to it in the scene/controller state.

- Click-to-create behavior:
  - On first click inside the canvas, translate pointer coordinates into normalized device coordinates.
  - Use `THREE.Raycaster.setFromCamera()`.
  - Intersect a fixed helper plane near the origin so the cube appears in a predictable place inside the coordinate-system.
  - Create only one cube initially.
  - On later clicks, choose one of these behaviors and keep it explicit in code:
    - ignore extra clicks while the cube exists, or
    - reposition the current cube
  - Preferred first implementation: ignore extra cube creation clicks after the first cube exists, because it keeps scope tight and matches the single-control-panel requirement.

- Rotation behavior:
  - Keep one active axis at a time: `x`, `y`, or `z`.
  - Apply rotation on each animation frame using a delta-independent speed strategy where practical.
  - A simple first implementation is acceptable:
    - `cube.rotation.x += speed` when axis is `x`
    - `cube.rotation.y += speed` when axis is `y`
    - `cube.rotation.z += speed` when axis is `z`

- Scale behavior:
  - Drive cube size by `mesh.scale.setScalar(value)`.
  - Keep slider bounds conservative, for example `0.5` to `3`.

- Face color behavior:
  - Provide six color inputs, one per cube face.
  - Update the corresponding material color directly.
  - Keep default values synchronized with state so rerenders do not drift.

- Resize handling:
  - On container or window resize:
    - update renderer size
    - update camera aspect ratio
    - call `camera.updateProjectionMatrix()`

- Cleanup:
  - Dispose renderer, geometry, materials, helpers, and listeners when navigating away from `menu5`.
  - This is important because the current app swaps page content in one shared container.

**UI Plan**
1. Canvas area
   - One canvas only.
   - Displays the axes and the cube together.

2. Control menu beside the canvas
   - `Scale` slider
   - `Rotate axis` selector with `X`, `Y`, `Z`
   - `Rotation speed` slider
   - `Face colors` section with six color inputs

3. Initial state
   - Controls shown as disabled until the cube is created.
   - Helper text explains the click action.

4. Post-creation state
   - Controls become enabled.
   - Current values reflect the created cube state.

**Suggested Markup Shape**
- Header: `Menu 5 - LLM - 3D cube`
- Layout wrapper with:
  - left: canvas container
  - right: cube control panel
- Keep the structure aligned with the existing simple DOM-rendering approach used by the current menu pages.

**Step-By-Step Development Plan**
1. Add dependency support
   - Install and register `three` in `package.json`.
   - Verify Vite resolves `three` ESM imports cleanly.

2. Extend navigation
   - Add `menu5` route in `src/components/Menu.js`.
   - Render the visible menu label as `LLM - 3D cube`.

3. Create the new page entry
   - Add `src/pages/menu5.js`.
   - Keep it thin and delegate immediately to the feature renderer.

4. Build the page renderer
   - Add canvas markup and control panel markup.
   - Create all DOM ids in one place.
   - Disable controls before cube creation.

5. Build scene bootstrapping
   - Create renderer, scene, camera, lights, and axes helper.
   - Start the render loop.
   - Verify the empty 3D coordinate-system renders before adding cube logic.

6. Add click-to-create cube flow
   - Capture canvas click.
   - Convert pointer to world position with `Raycaster`.
   - Create the cube at the resolved location.
   - Enable the control menu after cube creation.

7. Add transform controls
   - Implement scale updates.
   - Implement selected-axis rotation updates.
   - Implement adjustable rotation speed.

8. Add face-color controls
   - Create six independent color inputs.
   - Wire each input to one cube face material.
   - Keep light-blue defaults for all sides.

9. Add lifecycle safety
   - Handle resize.
   - Dispose all Three.js resources and listeners on teardown.

10. Add tests
   - Cover page rendering and control enablement.
   - Cover scene orchestration and cube creation flow with mocks.
   - Cover controller behavior for transform and face-color updates.

11. Validate integration
   - Run tests.
   - Run the Vite build.
   - Manually verify the menu navigation and 3D interaction in the browser.

**Testing Plan**
- Unit tests for `renderThreeCubeMenuPage.js`
  - renders title, canvas, and disabled controls initially
  - enables controls after cube creation callback
  - forwards UI events to the controller with normalized values

- Unit tests for `CubeController.js`
  - applies default state correctly
  - ignores transform requests before cube creation
  - updates scale
  - switches rotation axis
  - updates rotation speed
  - updates individual face colors

- Unit tests for `ThreeCubeScene.js`
  - creates scene dependencies with canvas input
  - adds axes helper with required axis colors
  - creates one cube on click
  - avoids duplicate cube creation when configured to keep a single cube
  - disposes geometry, materials, and renderer resources

- Integration validation
  - `npm test`
  - `npm run build`

**Manual Verification Checklist**
1. The navigation shows a new entry labeled `LLM - 3D cube`.
2. Opening `menu5` does not change the existing `menu4` 2D coordinate-system behavior.
3. The page renders one canvas with visible `X`, `Y`, and `Z` axes in red, green, and blue.
4. No cube is visible before the first click.
5. Clicking inside the 3D scene creates one light-blue cube in that same canvas.
6. The side control menu becomes active after the cube is created.
7. Scale changes resize the same cube.
8. Rotation axis selection changes the cube spin direction to the selected axis.
9. Rotation speed changes are visible immediately.
10. Each face color input updates the intended cube side.
11. Navigating away from `menu5` and back does not leave broken canvases or duplicate animation loops.

**Clean Code / SOLID Focus**
- Keep DOM rendering separate from Three.js scene logic.
- Keep scene ownership in one class so cleanup is reliable.
- Keep cube mutation behind a controller boundary instead of mutating the mesh directly from event handlers.
- Keep state defaults centralized so tests and runtime use the same source of truth.
- Keep the first implementation intentionally limited to one cube to avoid premature complexity.

**Risks And Mitigations**
- Risk: Three.js objects are harder to unit test directly in `jsdom`.
  - Mitigation: mock renderer-heavy collaborators and test orchestration boundaries instead of low-level WebGL output.

- Risk: Canvas click placement may feel inconsistent without a stable reference plane.
  - Mitigation: use an explicit invisible interaction plane anchored near the origin.

- Risk: Menu navigation may leak animation frames when content is rerendered.
  - Mitigation: require an explicit `dispose()` path from the page renderer.

**Out Of Scope For First Pass**
- Multiple cubes
- Dragging cubes with the mouse
- Physics or collision logic in 3D
- BabylonJS support
- Reworking the existing 2D coordinate-system feature

**Definition Of Done**
- `menu5` exists and is labeled `LLM - 3D cube`.
- The feature uses `three.js` only.
- The 3D scene shows red, green, and blue axes.
- A cube is created by clicking inside the 3D coordinate-system canvas.
- A side control menu updates cube scale, rotation axis, rotation speed, and face colors.
- Default cube face color is light blue.
- Existing 2D coordinate-system menus continue to work unchanged.
- Vitest coverage is added for the new feature slice.
- `npm test` and `npm run build` pass.