import { CoordinateSystem } from '../../../features/coordinate-system/CoordinateSystem.js';

const DEFAULT_CUBE_SCALE = 1;
const DEFAULT_CUBE_POSITION = Object.freeze({ x: 10, y: 10 });

function renderGrid(coordSystem, hideGridCheckbox) {
    coordSystem.clearCanvas();
    if (hideGridCheckbox?.checked) {
        coordSystem.drawWithoutGrid();
        return;
    }

    coordSystem.draw();
}

export function renderCoordinateMenuPage(
    container,
    { title, canvasId, hideGridId, sliderId, cubeScale = DEFAULT_CUBE_SCALE }
) {
    container.innerHTML = createCoordinateMenuMarkup({ title, canvasId, hideGridId, sliderId });
    return initializeCoordinateMenuInteractions(container, {
        canvasId,
        hideGridId,
        sliderId,
        cubeScale
    });
}

export function createCoordinateMenuMarkup({ title, canvasId, hideGridId, sliderId }) {
    return `
        <h2>${title}</h2>
        <div class="canvas-container">
            <canvas id="${canvasId}"></canvas>
            <div class="manipulations">
                <label>
                    <input id="${hideGridId}" type="checkbox"/>
                    Hide grid
                </label>
                <fieldset>
                <legend>Rectangle:</legend>
                <div>
                    Scaler
                    <div class="slidecontainer">
                        <input id="${sliderId}" class="slider" type="range" min="1" max="5" value="1">
                    </div>
                </div>
                </fieldset>
            </div>
        </div>
    `;
}

export function initializeCoordinateMenuInteractions(
    container,
    { canvasId, hideGridId, sliderId, cubeScale = DEFAULT_CUBE_SCALE }
) {
    const coordSystem = new CoordinateSystem({ canvasId });
    const hideGridCheckbox = container.querySelector(`#${hideGridId}`);
    const slider = container.querySelector(`#${sliderId}`);

    const renderScene = () => {
        const multiplier = Number(slider?.value ?? 1);
        renderGrid(coordSystem, hideGridCheckbox);
        coordSystem.drawCube(
            DEFAULT_CUBE_POSITION.x,
            DEFAULT_CUBE_POSITION.y,
            cubeScale * multiplier
        );
    };

    hideGridCheckbox?.addEventListener('change', renderScene);
    slider?.addEventListener('change', renderScene);

    renderScene();
    return { coordSystem, canvas: container.querySelector(`#${canvasId}`) };
}
