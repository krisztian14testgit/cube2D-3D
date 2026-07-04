# Implementation Plan: 3D Coordinate System with a Cube (Gemini 3.1 Pro)

## 1. Description
This plan outlines the integration of a 3D coordinate system and a controllable 3D cube using Babylon.js. The feature will be accessible via a new menu point, renaming the existing "menu5" to "Gemini3.1-pro - 3D cube".

## 2. Technical Stack
- Vanilla JavaScript (ES2022)
- Vite for building
- Babylon.js for 3D rendering
- Vitest for testing

## 3. Directory Structure
All related code for the Gemini 3.1 Pro 3D cube implementation will be placed under the `src/gemini3.1-pro/features/threejs-cube/` directory.

- `src/gemini3.1-pro/features/threejs-cube/BabylonCubeScene.js`: Core logic for setting up Babylon.js engine, scene, camera, lights, coordinate system, and the cube itself.
- `src/gemini3.1-pro/features/threejs-cube/CubeController.js`: Logic to handle interactions and UI controls for the cube (scale, rotation, speed, color).
- `src/gemini3.1-pro/features/threejs-cube/CubeState.js`: Manages the state of the cube (e.g., current rotation, scale, color).
- `src/gemini3.1-pro/features/threejs-cube/renderBabylonCubePage.js`: Responsible for rending the HTML structure (canvas, control menu) for Menu5.
- `src/gemini3.1-pro/features/threejs-cube/index.html`: A localized HTML file if necessary for previewing/demoing just this feature, though the main application will likely integrate it directly.

## 4. Implementation Steps

### Phase 1: Setup and Menu Integration
1.  **Install Babylon.js**: Add `@babylonjs/core` and `@babylonjs/gui` to package.json via npm.
2.  **Menu Integration**:
    - Update `src/components/Menu.js` to change the "menu5" entry to "Gemini3.1-pro - 3D cube".
    - Update `index.html` or routing logic to ensure clicking "Menu5" triggers the loading of the newly developed `renderBabylonCubePage.js`.

### Phase 2: Babylon.js Scene Setup (`BabylonCubeScene.js`)
1.  **Canvas Setup**: Initialize the Babylon Engine and Scene on the provided HTML Canvas element.
2.  **Camera & Light**: Add an ArcRotateCamera to allow the user to pan around the scene, and add basic lighting (HemisphericLight + DirectionalLight).
3.  **Coordinate System**: Implement a 3D coordinate system (axes).
    - X-axis: Red line.
    - Y-axis: Green line.
    - Z-axis: Blue line.
4.  **Click to Draw**: Add an observable to the scene (`scene.onPointerDown`). When the user clicks on the coordinate plane/system, generate a box mesh at the origin or the clicked location. Default color: Light blue. Only one cube should exist at a time.

### Phase 3: Cube Interaction and Controls (`CubeController.js` & `CubeState.js`)
1.  **UI Layout**: Design a control menu beside the canvas containing:
    - Sliders and/or number inputs for Scale (X, Y, Z or overall).
    - Checkboxes or radio buttons to select the axis of rotation (X, Y, Z).
    - Slider for rotation speed.
    - Color picker for surface sides.
2.  **State Management**: `CubeState.js` handles the current configuration map.
3.  **Applying Transformations**: Implement the logic to apply state changes to the constructed Babylon.js mesh within the render loop.
    - Setup scene rendering loop `engine.runRenderLoop(() => { ... })` and apply rotation based on selected axis and speed.
    - Apply scale transformations based on UI inputs.
    - Apply color materials based on color picker.

### Phase 4: Testing
1.  Write unit tests with Vitest for non-rendering logic (e.g., `CubeState.js`, utility functions in `CubeController.js` and `BabylonCubeScene.js` if mockable).
2.  Ensure separation of concerns so that business rules can be tested independently of the Babylon engine where possible.

### Phase 5: Refine and Polish
1.  Ensure SOLID principles are followed. Extract logic into small, manageable classes or functions.
2.  Implement clean code practices, meaningful variable names, and adequate comment documentation for complex 3D math/Babylon API usages.
3.  Verify integration in the main application flow without disrupting existing 2D features.