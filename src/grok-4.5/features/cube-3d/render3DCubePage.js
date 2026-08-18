import { createBabylonCubeController } from './BabylonCubeController.js';

const DEFAULT_SCALE = 1;
const DEFAULT_ROTATION_AXIS = 'y';
const DEFAULT_ROTATION_SPEED = 1;
const DEFAULT_CUBE_COLOR = '#87cefa';

export function create3DCubeMarkup({
    title,
    canvasId,
    scaleId,
    rotationAxisId,
    rotationSpeedId,
    cubeColorId,
    controlPanelId,
    statusId,
    createdBy
}) {
    return `
        <p><i>Created by ${createdBy}</i></p>
        <h2>${title}</h2>
        <p>Click inside the 3D coordinate system to draw the cube, then use the controls.</p>
        <div class="canvas-container">
            <canvas id="${canvasId}" width="513" height="513"></canvas>
            <div class="manipulations">
                <p id="${statusId}">Click the canvas to create the cube.</p>
                <fieldset id="${controlPanelId}">
                    <legend>Cube controls</legend>
                    <label for="${scaleId}">Scale</label>
                    <input id="${scaleId}" type="range" min="0.5" max="3" step="0.1" value="${DEFAULT_SCALE}">
                    <label for="${rotationAxisId}">Rotate axis</label>
                    <select id="${rotationAxisId}">
                        <option value="x">X axis</option>
                        <option value="y" selected>Y axis</option>
                        <option value="z">Z axis</option>
                    </select>
                    <label for="${rotationSpeedId}">Rotation speed</label>
                    <input id="${rotationSpeedId}" type="range" min="0" max="6" step="0.1" value="${DEFAULT_ROTATION_SPEED}">
                    <label for="${cubeColorId}">Cube color</label>
                    <input id="${cubeColorId}" type="color" value="${DEFAULT_CUBE_COLOR}">
                </fieldset>
            </div>
        </div>
    `;
}

function setControlAvailability(controls, enabled) {
    controls.panel.disabled = !enabled;
    controls.status.textContent = enabled
        ? 'Cube is active. Adjust transform and rotation controls.'
        : 'Click the canvas to create the cube.';
}

export function initialize3DCubeInteractions(
    container,
    {
        canvasId,
        scaleId,
        rotationAxisId,
        rotationSpeedId,
        cubeColorId,
        controlPanelId,
        statusId,
        controllerFactory = createBabylonCubeController
    }
) {
    const canvas = container.querySelector(`#${canvasId}`);
    if (!canvas) {
        throw new Error('Canvas element not found');
    }

    const controls = {
        panel: container.querySelector(`#${controlPanelId}`),
        status: container.querySelector(`#${statusId}`),
        scale: container.querySelector(`#${scaleId}`),
        axis: container.querySelector(`#${rotationAxisId}`),
        speed: container.querySelector(`#${rotationSpeedId}`),
        color: container.querySelector(`#${cubeColorId}`)
    };

    const controller = controllerFactory(canvas, {
        rotationAxis: controls.axis?.value ?? DEFAULT_ROTATION_AXIS,
        rotationSpeed: Number(controls.speed?.value ?? DEFAULT_ROTATION_SPEED),
        cubeColor: controls.color?.value ?? DEFAULT_CUBE_COLOR
    });
    setControlAvailability(controls, false);

    const onCanvasClick = () => {
        if (!controller.createCubeIfMissing()) {
            return;
        }

        controller.setCubeScale(Number(controls.scale?.value ?? DEFAULT_SCALE));
        setControlAvailability(controls, true);
    };
    const onScaleInput = () => {
        controller.setCubeScale(Number(controls.scale?.value ?? DEFAULT_SCALE));
    };
    const onAxisChange = () => {
        controller.setRotationAxis(controls.axis?.value ?? DEFAULT_ROTATION_AXIS);
    };
    const onSpeedInput = () => {
        controller.setRotationSpeed(Number(controls.speed?.value ?? DEFAULT_ROTATION_SPEED));
    };
    const onColorInput = () => {
        controller.setCubeColor(controls.color?.value ?? DEFAULT_CUBE_COLOR);
    };

    canvas.addEventListener('click', onCanvasClick);
    controls.scale?.addEventListener('input', onScaleInput);
    controls.axis?.addEventListener('change', onAxisChange);
    controls.speed?.addEventListener('input', onSpeedInput);
    controls.color?.addEventListener('input', onColorInput);

    const cleanup = () => {
        canvas.removeEventListener('click', onCanvasClick);
        controls.scale?.removeEventListener('input', onScaleInput);
        controls.axis?.removeEventListener('change', onAxisChange);
        controls.speed?.removeEventListener('input', onSpeedInput);
        controls.color?.removeEventListener('input', onColorInput);
        controller.dispose();
    };

    return { canvas, controller, cleanup };
}

export function render3DCubePage(container, {
    title = 'Grok4.5 - 3D cube',
    canvasId = 'canvas-menu7-3d',
    scaleId = 'cube-scale-menu7',
    rotationAxisId = 'cube-rotation-axis-menu7',
    rotationSpeedId = 'cube-rotation-speed-menu7',
    cubeColorId = 'cube-color-menu7',
    controlPanelId = 'cube-controls-menu7',
    statusId = 'cube-status-menu7',
    createdBy = 'Grok 4.5',
    controllerFactory = createBabylonCubeController
} = {}) {
    container.innerHTML = create3DCubeMarkup({
        title,
        canvasId,
        scaleId,
        rotationAxisId,
        rotationSpeedId,
        cubeColorId,
        controlPanelId,
        statusId,
        createdBy
    });

    return initialize3DCubeInteractions(container, {
        canvasId,
        scaleId,
        rotationAxisId,
        rotationSpeedId,
        cubeColorId,
        controlPanelId,
        statusId,
        controllerFactory
    });
}
