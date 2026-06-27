import { BouncingSquaresSimulation } from '../gpt5.3-codex/features/bouncing-squares/BouncingSquaresSimulation.js';
import {
    createCoordinateMenuMarkup,
    initializeCoordinateMenuInteractions
} from '../gpt5.3-codex/features/coordinate-system/renderCoordinateMenuPage.js';

export function renderMenu1(container) {
    container.innerHTML = `
        <h3>Step 1 - Basic Coordinate System</h3>
        ${createCoordinateMenuMarkup({
            title: 'Menu 1 - Coordinate System',
            canvasId: 'canvas-menu1',
            hideGridId: 'hide-grid-1',
            sliderId: 'my-slider-1'
        })}
        <hr>
        <h3>Step 2 - Bouncing & Rotating Squares</h3>
        <div class="canvas-container">
            <canvas id="canvas-menu2"></canvas>
        </div>
    `;

    initializeCoordinateMenuInteractions(container, {
        canvasId: 'canvas-menu1',
        hideGridId: 'hide-grid-1',
        sliderId: 'my-slider-1'
    });

    const animatedCanvas = container.querySelector('#canvas-menu2');
    if (!animatedCanvas) {
        return;
    }

    const simulation = new BouncingSquaresSimulation(animatedCanvas);
    simulation.start();
}
