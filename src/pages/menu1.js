import { CoordinateSystem } from '../claude-sonnet-4.6/features/coordinate-system/CoordinateSystem.js';
import { BouncingSquaresScene } from '../claude-sonnet-4.6/features/bouncing-squares/BouncingSquaresScene.js';
import { PhysicsEngine } from '../claude-sonnet-4.6/features/bouncing-squares/PhysicsEngine.js';
import { SquareRenderer } from '../claude-sonnet-4.6/features/bouncing-squares/SquareRenderer.js';

export function renderMenu1(container) {
    container.innerHTML = `
        <h2>Step 1 - Basic Coordinate System</h2>
        <div class="canvas-container">
            <canvas id="canvas-menu1"></canvas>
            <div class="manipulations">
                <label>
                    <input id="hide-grid-1" type="checkbox"/>
                    Hide grid
                </label>
                <fieldset>
                <legend>Rectangle:</legend>
                <div>
                    Scaler
                    <div class="slidecontainer">
                        <input id="my-slider-1" class="slider" type="range" min="1" max="5" value="1">
                    </div>
                </div>
                </fieldset>
            </div>
        </div>

        <hr>

        <h2>Step 2 - Bouncing &amp; Rotating Squares</h2>
        <p>Click on the canvas to spawn a square. Squares bounce off the walls and disappear when they collide with each other.</p>
        <div class="canvas-container">
            <canvas id="canvas-step2"></canvas>
        </div>
    `;

    // ── Step 1: Basic Coordinate System ──────────────────────────────────────
    const coordSystem = new CoordinateSystem({ canvasId: 'canvas-menu1' });
    const CUBE_SCALE = 1;
    coordSystem.draw();
    coordSystem.drawCube(10, 10, CUBE_SCALE);

    const hideCheckbox = document.getElementById('hide-grid-1');
    if (hideCheckbox) {
        hideCheckbox.addEventListener('change', (event) => {
            coordSystem.clearCanvas();
            if (event.target.checked) {
                coordSystem.drawWithoutGrid();
            } else {
                coordSystem.draw();
            }
            const slider = document.getElementById('my-slider-1');
            const multiplier = slider ? Number(slider.value) : 1;
            coordSystem.drawCube(10, 10, CUBE_SCALE * multiplier);
        });
    }

    const slider = document.getElementById('my-slider-1');
    if (slider) {
        slider.addEventListener('change', (event) => {
            const multiplier = Number(event.target.value);
            coordSystem.clearCanvas();
            if (hideCheckbox && hideCheckbox.checked) {
                coordSystem.drawWithoutGrid();
            } else {
                coordSystem.draw();
            }
            coordSystem.drawCube(10, 10, CUBE_SCALE * multiplier);
        });
    }

    // ── Step 2: Bouncing & Rotating Squares ──────────────────────────────────
    const step2Canvas = document.getElementById('canvas-step2');
    if (step2Canvas) {
        const coordSystem2 = new CoordinateSystem({ canvasId: 'canvas-step2' });
        const scene = new BouncingSquaresScene(
            step2Canvas,
            coordSystem2,
            new PhysicsEngine(),
            new SquareRenderer()
        );
        scene.start();
    }
}

