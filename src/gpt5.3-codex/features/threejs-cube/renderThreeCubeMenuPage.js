import { CubeController } from './CubeController.js';
import {
    DEFAULT_CUBE_SCALE,
    DEFAULT_FACE_COLOR,
    DEFAULT_ROTATION_AXIS,
    DEFAULT_ROTATION_SPEED,
    FACE_COUNT
} from './CubeState.js';
import { ThreeCubeScene } from './ThreeCubeScene.js';

export const THREE_CUBE_MENU_IDS = Object.freeze({
    canvas: 'canvas-menu5',
    controls: 'three-cube-controls',
    scale: 'three-cube-scale',
    rotationAxis: 'three-cube-rotation-axis',
    rotationSpeed: 'three-cube-rotation-speed',
    faceColors: Object.freeze(
        Array.from({ length: FACE_COUNT }, (_, index) => `three-cube-face-${index}`)
    )
});

const FACE_LABELS = Object.freeze(['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom']);

export function renderThreeCubeMenuPage(
    container,
    {
        title = 'Menu 5 - 3D cube by GPT-5.3 Codex',
        SceneClass = ThreeCubeScene,
        ControllerClass = CubeController
    } = {}
) {
    container.innerHTML = createThreeCubeMenuMarkup({ title });
    return initializeThreeCubeMenuInteractions(container, { SceneClass, ControllerClass });
}

export function initializeThreeCubeMenuInteractions(
    container,
    { SceneClass = ThreeCubeScene, ControllerClass = CubeController } = {}
) {
    const elements = getRequiredDomElements(container);
    const scene = new SceneClass({ canvas: elements.canvas }).initialize();
    const controller = new ControllerClass(scene);

    const handleCubeCreationRequest = (event) => {
        if (!controller.createCubeAtPointer(event)) {
            return;
        }

        setControlsDisabled(elements, false);
    };

    const handleCanvasContextMenu = (event) => {
        event.preventDefault();
        handleCubeCreationRequest(event);
    };

    const handleScaleInput = (event) => {
        controller.setScale(Number(event.target.value));
    };

    const handleRotationAxisChange = (event) => {
        controller.setRotationAxis(event.target.value);
    };

    const handleRotationSpeedInput = (event) => {
        controller.setRotationSpeed(Number(event.target.value));
    };

    const handleFaceColorInput = (event) => {
        controller.setFaceColor(Number(event.target.dataset.faceIndex), event.target.value);
    };

    elements.canvas.addEventListener('click', handleCubeCreationRequest);
    elements.canvas.addEventListener('contextmenu', handleCanvasContextMenu);
    elements.scaleInput.addEventListener('input', handleScaleInput);
    elements.rotationAxisSelect.addEventListener('change', handleRotationAxisChange);
    elements.rotationSpeedInput.addEventListener('input', handleRotationSpeedInput);
    elements.faceColorInputs.forEach((input) => {
        input.addEventListener('input', handleFaceColorInput);
    });

    return {
        canvas: elements.canvas,
        controls: elements.controls,
        scene,
        controller,
        dispose() {
            elements.canvas.removeEventListener('click', handleCubeCreationRequest);
            elements.canvas.removeEventListener('contextmenu', handleCanvasContextMenu);
            elements.scaleInput.removeEventListener('input', handleScaleInput);
            elements.rotationAxisSelect.removeEventListener('change', handleRotationAxisChange);
            elements.rotationSpeedInput.removeEventListener('input', handleRotationSpeedInput);
            elements.faceColorInputs.forEach((input) => {
                input.removeEventListener('input', handleFaceColorInput);
            });
            scene.dispose();
        }
    };
}

export function createThreeCubeMenuMarkup({ title }) {
    return `
        <h2>${title}</h2>
        <div class="canvas-container">
            <div>
                <canvas id="${THREE_CUBE_MENU_IDS.canvas}" width="640" height="420"></canvas>
                <p>Click (left or right) inside the 3D coordinate-system to create the cube.</p>
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
                            value="${DEFAULT_CUBE_SCALE}"
                            disabled
                        >
                    </div>
                    <label for="${THREE_CUBE_MENU_IDS.rotationAxis}">Rotate axis</label>
                    <select id="${THREE_CUBE_MENU_IDS.rotationAxis}" disabled>
                        <option value="x"${DEFAULT_ROTATION_AXIS === 'x' ? ' selected' : ''}>X</option>
                        <option value="y"${DEFAULT_ROTATION_AXIS === 'y' ? ' selected' : ''}>Y</option>
                        <option value="z"${DEFAULT_ROTATION_AXIS === 'z' ? ' selected' : ''}>Z</option>
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
                            value="${DEFAULT_ROTATION_SPEED}"
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

function getRequiredDomElements(container) {
    const canvas = getRequiredElement(container, `#${THREE_CUBE_MENU_IDS.canvas}`, 'canvas');
    const controls = getRequiredElement(container, `#${THREE_CUBE_MENU_IDS.controls}`, 'controls');
    const scaleInput = getRequiredElement(container, `#${THREE_CUBE_MENU_IDS.scale}`, 'scale');
    const rotationAxisSelect = getRequiredElement(
        container,
        `#${THREE_CUBE_MENU_IDS.rotationAxis}`,
        'rotation axis'
    );
    const rotationSpeedInput = getRequiredElement(
        container,
        `#${THREE_CUBE_MENU_IDS.rotationSpeed}`,
        'rotation speed'
    );
    const faceColorInputs = THREE_CUBE_MENU_IDS.faceColors.map((id, index) => getRequiredElement(
        container,
        `#${id}`,
        `face color ${index}`
    ));

    return {
        canvas,
        controls,
        scaleInput,
        rotationAxisSelect,
        rotationSpeedInput,
        faceColorInputs
    };
}

function getRequiredElement(container, selector, label) {
    const element = container.querySelector(selector);
    if (!element) {
        throw new Error(`Missing required ${label} element`);
    }

    return element;
}

function setControlsDisabled(elements, isDisabled) {
    elements.scaleInput.disabled = isDisabled;
    elements.rotationAxisSelect.disabled = isDisabled;
    elements.rotationSpeedInput.disabled = isDisabled;
    elements.faceColorInputs.forEach((input) => {
        input.disabled = isDisabled;
    });
}
