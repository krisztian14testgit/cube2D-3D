# Gemini 3.1 Pro - 3D Cubes Exploding Implementation Plan

## Goal
Implement a 3D scene using Three.js where a huge transparent sphere acts as a boundary. Users can click inside the sphere to spawn up to 10-100 cubes (configurable). Cubes have a random scale (1-5) and random rotations on the x, y, and z axes. When cubes collide, they explode (using a Three.js explosion animation) and are removed from the scene.

## Feature Specifications
1. **Container / Boundary**: A large transparent sphere with drawn border lines on its surface.
2. **Cube Spawning**: 
   - Triggered by left mouse click.
   - Initial spawn random scale between [1, 5].
   - Random rotations on X, Y, and Z axes.
3. **Collision & Explosion**:
   - Limit the total active cubes based on user settings (min 10, max 100).
   - Detect collisions between cubes.
   - When cubes intersect, load an explosion animation, then remove the collided cubes from the tracking array (by index) and from the scene.
4. **Camera Controls**:
   - A rotation camera around the sphere.
   - Users can rotate the camera using the right mouse click.
5. **Control Panel**:
   - Setting for Sphere Scale (Initial value: 8).
   - Setting for Max Cubes (Min: 10, Max: 100).
6. **UI Integration**:
   - The feature should be added to the UI under the "Gemini3.1-pro - 3D cube" menu.
   - It will be placed below the previous feature.
   - Separated by a line divider and its own header title.

## Technical Details
- **Location**: `src/gemini3.1-pro/features/cubes-exploding/`
- **Framework**: Three.js
- **Testing**: Vitest for unit tests.
- **Code Style**: SOLID principles, clean code.

## Development Steps
1. **Setup Folder & Files**: Create the necessary structure inside `src/gemini3.1-pro/features/cubes-exploding/`.
2. **UI Implementation**: Update the "Gemini3.1-pro - 3D cube" menu to add the new settings and header, separated by a divider.
3. **Three.js Scene Setup**: Initialize the WebGLRenderer, Scene, and Camera. Implement `OrbitControls` for right-click camera rotation.
4. **Sphere Boundary**: Render the transparent sphere with wireframe/lines. Bind its scale to the control panel settings.
5. **Cube Manager**: Handle cube creation on left click, store cubes in an indexed array/list.
6. **Collision Detection**: On each animation frame, check distances/bounding boxes between cubes.
7. **Explosion Animation**: Create a particle-based explosion effect in Three.js upon collision. Remove involved cubes.
8. **Unit Tests**: Write Vitest test cases covering cube spawning, collision logic, bounds checking, and config updating.
9. **Refactoring & Clean up**: Review code against SOLID principles. Run tests to ensure high coverage.
