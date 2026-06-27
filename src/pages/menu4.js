import { CoordinateSystem } from '../claude-sonnet.4./features/coordinate-system/CoordinateSystem.js';

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

    const coordSystem = new CoordinateSystem({ canvasId: 'canvas-menu4' });
    const CUBE_SCALE = 1;
    coordSystem.draw();
    coordSystem.drawCube(10, 10, CUBE_SCALE);

    const hideCheckbox = document.getElementById('hide-grid-4');
    if (hideCheckbox) {
        hideCheckbox.addEventListener('change', (event) => {
            coordSystem.clearCanvas();
            if (event.target.checked) {
                coordSystem.drawWithoutGrid();
            } else {
                coordSystem.draw();
            }
            const slider = document.getElementById('my-slider-4');
            const multiplier = slider ? Number(slider.value) : 1;
            coordSystem.drawCube(10, 10, CUBE_SCALE * multiplier);
        });
    }

    const slider = document.getElementById('my-slider-4');
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
}
