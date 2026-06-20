import { CoordinateSystem } from '../features/coordinate-system/CoordinateSystem.js';

export function renderMenu3(container) {
    container.innerHTML = `
        <h2>Menu 3 - 2D Cube with Scale &amp; Rotation</h2>
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
                <div>
                    Rotation (degrees)
                    <div class="slidecontainer">
                        <input id="my-rotation-3" class="slider" type="range" min="0" max="360" value="0">
                    </div>
                </div>
                </fieldset>
            </div>
        </div>
    `;

    const coordSystem = new CoordinateSystem({ canvasId: 'canvas-menu3' });
    const CUBE_SCALE = 1;
    coordSystem.draw();
    coordSystem.drawCube(10, 10, CUBE_SCALE);

    const hideCheckbox = document.getElementById('hide-grid-3');
    const slider = document.getElementById('my-slider-3');
    const rotationSlider = document.getElementById('my-rotation-3');

    function redraw() {
        const multiplier = slider ? Number(slider.value) : 1;
        const angleDeg = rotationSlider ? Number(rotationSlider.value) : 0;
        coordSystem.clearCanvas();
        if (hideCheckbox && hideCheckbox.checked) {
            coordSystem.drawWithoutGrid();
        } else {
            coordSystem.draw();
        }
        coordSystem.drawCube(10, 10, CUBE_SCALE * multiplier, angleDeg);
    }

    if (hideCheckbox) {
        hideCheckbox.addEventListener('change', redraw);
    }

    if (slider) {
        slider.addEventListener('change', redraw);
    }

    if (rotationSlider) {
        rotationSlider.addEventListener('change', redraw);
    }
}
