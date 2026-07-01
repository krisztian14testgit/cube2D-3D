import { Color } from 'three';

export const THREE_CUBE_MENU_IDS = Object.freeze({
    canvas: 'canvas-menu5',
    controls: 'three-cube-controls',
    scale: 'three-cube-scale',
    rotationAxis: 'three-cube-rotation-axis',
    rotationSpeed: 'three-cube-rotation-speed',
    faceColors: Object.freeze([
        'three-cube-face-0',
        'three-cube-face-1',
        'three-cube-face-2',
        'three-cube-face-3',
        'three-cube-face-4',
        'three-cube-face-5'
    ])
});

const DEFAULT_FACE_COLOR = `#${new Color('lightblue').getHexString()}`;
const FACE_LABELS = Object.freeze(['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom']);

export function renderThreeCubeMenuPage(container, { title } = {}) {
    container.innerHTML = createThreeCubeMenuMarkup({
        title: title ?? 'Menu 5 - LLM - 3D cube'
    });

    return {
        canvas: container.querySelector(`#${THREE_CUBE_MENU_IDS.canvas}`),
        controls: container.querySelector(`#${THREE_CUBE_MENU_IDS.controls}`)
    };
}

export function createThreeCubeMenuMarkup({ title }) {
    return `
        <p>This 3D cube feature is being built by GPT-5.3 Codex.</p>
        <h2>${title}</h2>
        <div class="canvas-container">
            <div>
                <canvas id="${THREE_CUBE_MENU_IDS.canvas}"></canvas>
                <p>Click inside the 3D coordinate-system to create the cube.</p>
            </div>
            <div id="${THREE_CUBE_MENU_IDS.controls}" class="manipulations">
                <fieldset>
                    <legend>Cube controls</legend>
                    <label for="${THREE_CUBE_MENU_IDS.scale}">Scale</label>
                    <div class="slidecontainer">
                        <input
                            id="${THREE_CUBE_MENU_IDS.scale}"
                            class="slider"
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value="1"
                            disabled
                        >
                    </div>
                    <label for="${THREE_CUBE_MENU_IDS.rotationAxis}">Rotate axis</label>
                    <select id="${THREE_CUBE_MENU_IDS.rotationAxis}" disabled>
                        <option value="x">X</option>
                        <option value="y">Y</option>
                        <option value="z">Z</option>
                    </select>
                    <label for="${THREE_CUBE_MENU_IDS.rotationSpeed}">Rotation speed</label>
                    <div class="slidecontainer">
                        <input
                            id="${THREE_CUBE_MENU_IDS.rotationSpeed}"
                            class="slider"
                            type="range"
                            min="0"
                            max="0.2"
                            step="0.01"
                            value="0.05"
                            disabled
                        >
                    </div>
                    <fieldset>
                        <legend>Face colors</legend>
                        ${createFaceColorInputsMarkup()}
                    </fieldset>
                </fieldset>
            </div>
        </div>
    `;
}

function createFaceColorInputsMarkup() {
    return FACE_LABELS.map((label, index) => `
        <label for="${THREE_CUBE_MENU_IDS.faceColors[index]}">${label}</label>
        <input
            id="${THREE_CUBE_MENU_IDS.faceColors[index]}"
            type="color"
            value="${DEFAULT_FACE_COLOR}"
            data-face-index="${index}"
            disabled
        >
    `).join('');
}
