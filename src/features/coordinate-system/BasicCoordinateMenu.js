import { CoordinateSystem } from './CoordinateSystem.js';

export class BasicCoordinateMenu {
    #coordSystem;
    #canvasId;
    #hideCheckboxId;
    #sliderId;
    #cubeScale = 1;

    constructor(canvasId, hideCheckboxId, sliderId) {
        this.#canvasId = canvasId;
        this.#hideCheckboxId = hideCheckboxId;
        this.#sliderId = sliderId;
    }

    init() {
        this.#coordSystem = new CoordinateSystem({ canvasId: this.#canvasId });
        this.#coordSystem.draw();
        this.#coordSystem.drawCube(10, 10, this.#cubeScale);
        this.#attachEventListeners();
    }

    #attachEventListeners() {
        const hideCheckbox = document.getElementById(this.#hideCheckboxId);
        const slider = document.getElementById(this.#sliderId);

        if (hideCheckbox) {
            hideCheckbox.addEventListener('change', (event) => {
                this.#updateDisplay(event.target.checked, slider ? Number(slider.value) : 1);
            });
        }

        if (slider) {
            slider.addEventListener('change', (event) => {
                this.#updateDisplay(hideCheckbox ? hideCheckbox.checked : false, Number(event.target.value));
            });
        }
    }

    #updateDisplay(hideGrid, multiplier) {
        this.#coordSystem.clearCanvas();
        if (hideGrid) {
            this.#coordSystem.drawWithoutGrid();
        } else {
            this.#coordSystem.draw();
        }
        this.#coordSystem.drawCube(10, 10, this.#cubeScale * multiplier);
    }
}
