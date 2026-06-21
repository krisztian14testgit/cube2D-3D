import { BasicCoordinateMenu } from '../features/coordinate-system/BasicCoordinateMenu.js';
import { BouncingSquares } from '../features/bouncing-squares/BouncingSquares.js';

export function renderMenu2(container) {
    container.innerHTML = `
        <h2>Menu 2 - Basic Coordinate System</h2>
        <div class="canvas-container">
            <canvas id="canvas-menu2"></canvas>
            <div class="manipulations">
                <label>
                    <input id="hide-grid-2" type="checkbox"/>
                    Hide grid
                </label>
                <fieldset>
                <legend>Rectangle:</legend>
                <div>
                    Scaler
                    <div class="slidecontainer">
                        <input id="my-slider-2" class="slider" type="range" min="1" max="5" value="1">
                    </div>
                </div>
                </fieldset>
            </div>
        </div>
        <hr>
        <h2>Step 2 - Bouncing & Rotating Squares</h2>
        <div class="canvas-container">
            <canvas id="canvas-menu2-step2"></canvas>
        </div>
    `;

    // Initialize Basic Coordinate Menu
    const basicMenu = new BasicCoordinateMenu('canvas-menu2', 'hide-grid-2', 'my-slider-2');
    basicMenu.init();

    // Initialize Step 2 implementation
    const bouncingSquares = new BouncingSquares('canvas-menu2-step2');
    bouncingSquares.startAnimation();
}
