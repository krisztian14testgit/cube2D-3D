import { CoordinateSystem } from './step2-cube-2d/coordinate-system.js';

const coordSystem = new CoordinateSystem();
coordSystem.draw();
coordSystem.drawCube(10, 10, 4);

const hideCheckbox = document.getElementById('hide-grid');
if (hideCheckbox) {
    hideCheckbox.onclick = function(event) {
        coordSystem.clearCanvas();
        if (event.target.checked) {
            coordSystem.drawWithoutGrid();
        } else {
            coordSystem.draw();
        }
    }
}

const mySlider = document.getElementById('my-slider');
if (mySlider) {
    mySlider.onchange = function(event) {
        const scaler = Number(event.target.value);
        coordSystem.scaleCube(scaler);
    }
}