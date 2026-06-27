import { BasicCoordinateMenu } from '../gemini3.1-pro/features/coordinate-system/BasicCoordinateMenu.js';

export function renderMenu1(container) {
    container.innerHTML = `
        <h2>Menu 1 - Basic Coordinate System</h2>
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
    `;

    const basicMenu = new BasicCoordinateMenu('canvas-menu1', 'hide-grid-1', 'my-slider-1');
    basicMenu.init();
}
