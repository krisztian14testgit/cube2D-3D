import { CoordinateSystem } from './CoordinateSystem.js';

export class BasicCoordinateMenu {
    _coordSystem;
    _canvasId;
    _hideCheckboxId;
    _sliderId;
    _cubeScale = 1;

    constructor(canvasId, hideCheckboxId, sliderId) {
        this._canvasId = canvasId;
        this._hideCheckboxId = hideCheckboxId;
        this._sliderId = sliderId;
    }

    init() {
        this._coordSystem = new CoordinateSystem({ canvasId: this._canvasId });
        this._coordSystem.draw();
        this._coordSystem.drawCube(10, 10, this._cubeScale);
        this._attachEventListeners();
    }

    _attachEventListeners() {
        const hideCheckbox = document.getElementById(this._hideCheckboxId);
        const slider = document.getElementById(this._sliderId);

        if (hideCheckbox) {
            hideCheckbox.addEventListener('change', (event) => {
                this._updateDisplay(event.target.checked, slider ? Number(slider.value) : 1);
            });
        }

        if (slider) {
            slider.addEventListener('change', (event) => {
                this._updateDisplay(hideCheckbox ? hideCheckbox.checked : false, Number(event.target.value));
            });
        }
    }

    _updateDisplay(hideGrid, multiplier) {
        this._coordSystem.clearCanvas();
        if (hideGrid) {
            this._coordSystem.drawWithoutGrid();
        } else {
            this._coordSystem.draw();
        }
        this._coordSystem.drawCube(10, 10, this._cubeScale * multiplier);
    }
}
