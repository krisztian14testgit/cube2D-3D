# 3D Implementation Plan: Grok 4.5 - 3D cube

## Goal
Add a new **menu7** experience that shows a Babylon.js 3D coordinate system with red, green, and blue axes, creates a cube on canvas click, and exposes cube transform controls beside the same canvas.

## Scope
- Add a new navigation entry for **menu7** named **Grok4.5 - 3D cube**
- Keep all existing 2D coordinate-system and square features unchanged
- Place Grok-specific page wiring under `src/grok-4.5`
- Reuse the existing Babylon.js cube scene behavior where it already matches the requested feature

## Functional Requirements
1. **3D Coordinate System**
   - Render the X, Y, and Z axes on one Babylon.js canvas
   - Use red for X, green for Y, and blue for Z
2. **Cube Creation**
   - Create the cube when the user clicks inside the 3D coordinate-system canvas
   - Keep the coordinate system and cube on the same canvas
3. **Control Menu**
   - Show the cube controls beside the canvas
   - Keep controls disabled until the cube is created
   - Support scale, rotation axis selection, rotation speed, and cube surface color
   - Use light blue as the default cube color
4. **Behavior Guardrails**
   - Do not change the existing 2D menu flows
   - Keep cleanup logic so menu switches do not leak Babylon.js resources

## Implementation Steps
1. Add a `menu7` page entry and label in the main menu.
2. Create a Grok-specific page wrapper under `src/grok-4.5/features/cube-3d/` that supplies `menu7` IDs, title text, and attribution.
3. Wire `src/pages/menu7.js` to render the Grok 4.5 cube page.
4. Add unit tests for the Grok wrapper, `menu7` wiring, and main-menu integration.
5. Run the existing project validation commands: `npm run build` and `npm test`.

## Extra Focus Topics
- Favor small wrappers over duplicating the Babylon.js interaction logic
- Keep menu IDs isolated so `menu7` does not interfere with existing pages
- Preserve the current control flow for click-to-create and live transform updates
