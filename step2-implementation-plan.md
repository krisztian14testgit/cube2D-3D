## Plan: Step 2 Bouncing & Rotating Squares

**Git Workflow**
- First, create a new branch from `development` (or `develop`).
- When the implementation is finished, make a new Pull Request back to the `develop` branch.

**Overview**
Implement the Step 2 requirements in the same Menu 1 view.

**Steps**
1. **Extend UI (menu1.js)**: Update the `innerHTML` string in menu1.js. Add an `<hr>` below Step 1, add headings for 1 and 2, and add a second `<canvas id="canvas-menu2"></canvas>`.
2. **Animation Loop Context (menu1.js)**: Inside `renderMenu1`, instantiate a second `CoordinateSystem` targeted at `canvas-menu2`, and set up a state array to hold `squares`.
3. **Click Handling (menu1.js)**: Attach a `click` listener to the new canvas. When clicked, generate a new square object at those coordinates. The object needs `x`, `y`, velocities `dx` and `dy` (randomized directions), `size` (randomized scale), `angle` (initial `0`), and `rotationSpeed`.
4. **Animation & Physics (menu1.js)**: Set up a `requestAnimationFrame` loop that runs continuously for the second canvas:
   - Clear the canvas and redraw the grid using the coordinate system context.
   - Update movement and rotation (`x += dx`, `y += dy`, `angle += rotationSpeed`) for all active squares.
   - **Boundaries**: If a square's edge hits or exceeds the width/height of the canvas, invert its `dx` or `dy` velocity to simulate bouncing.
   - **Collisions**: Calculate the distance between squares. If two squares intersect/collide, remove both of them from the `squares` array.
5. **Drawing (menu1.js)**: For each square, use the coordinate system's context (`ctx.save()`, `ctx.translate()`, `ctx.rotate()`, `ctx.strokeRect()`, `ctx.restore()`) to draw the rotating shape precisely.

**Relevant files**
- menu1.js — All HTML layout changes and complex animation logic will be isolated and self-contained here, making it the central working file.

**Verification**
1. Page renders both canvases separated by an `<hr>` with proper headings.
2. Clicking the bottom canvas spawns random-sized rotating squares exactly at the cursor point.
3. Squares move continuously and bounce off the boundaries of the grid.
4. Squares disappear immediately upon colliding with one another.
5. Code is branch-isolated and submitted as a PR to `develop`.

**Testing part**
Make sure the changes are right in that case to run `npm run build`. If you get success build, the changes are passed.
If you get error during the build. Analyze the errors and try to fix them. Iterate until you get success build result.

