import { BasicCoordinateMenu } from '../gemini3.1-pro/features/coordinate-system/BasicCoordinateMenu.js';

export function renderMenu3(container) {
    container.innerHTML = `
        <h2>Menu 3 - Basic Coordinate System</h2>
        <div class="canvas-container">
            <canvas id="canvas-menu3"></canvas>
            <div class="manipulations">
                <label>
                    <input id="hide-grid-3" type="checkbox"/>
                    Hide grid
                </label>
                <fieldset>
                <legend>Rectangle:</legend>
                <div>
                    Scaler
                    <div class="slidecontainer">
                        <input id="my-slider-3" class="slider" type="range" min="1" max="5" value="1">
                    </div>
                </div>
                </fieldset>
            </div>
        </div>
    `;

    const basicMenu = new BasicCoordinateMenu('canvas-menu3', 'hide-grid-3', 'my-slider-3');
    basicMenu.init();
}
