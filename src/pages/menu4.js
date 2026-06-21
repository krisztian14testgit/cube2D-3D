import { BasicCoordinateMenu } from '../features/coordinate-system/BasicCoordinateMenu.js';

export function renderMenu4(container) {
    container.innerHTML = `
        <h2>Menu 4 - Coordinate System</h2>
        <div class="canvas-container">
            <canvas id="canvas-menu4"></canvas>
            <div class="manipulations">
                <label>
                    <input id="hide-grid-4" type="checkbox"/>
                    Hide grid
                </label>
                <fieldset>
                <legend>Rectangle:</legend>
                <div>
                    Scaler
                    <div class="slidecontainer">
                        <input id="my-slider-4" class="slider" type="range" min="1" max="5" value="1">
                    </div>
                </div>
                </fieldset>
            </div>
        </div>
    `;

    const basicMenu = new BasicCoordinateMenu('canvas-menu4', 'hide-grid-4', 'my-slider-4');
    basicMenu.init();
}
