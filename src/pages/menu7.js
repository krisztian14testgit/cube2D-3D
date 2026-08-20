import { render3DCubePage } from '../grok4.5/features/cube-3d/render3DCubePage.js';
import { renderCubesExplodingMenuPage } from '../grok4.5/features/cubes-exploding/renderCubesExplodingMenuPage.js';

export function renderMenu7(container) {
    container.innerHTML = '';

    const cubeSection = document.createElement('section');
    const explodingSection = document.createElement('section');
    explodingSection.style.paddingTop = '16px';
    explodingSection.style.marginTop = '16px';
    explodingSection.style.borderTop = '1px solid #ccc';

    container.appendChild(cubeSection);
    container.appendChild(explodingSection);

    const cubeFeature = render3DCubePage(cubeSection, {
        title: 'Grok4.5 - 3D babylonjs',
        canvasId: 'canvas-menu7-3d',
        scaleId: 'cube-scale-menu7',
        rotationAxisId: 'cube-rotation-axis-menu7',
        rotationSpeedId: 'cube-rotation-speed-menu7',
        cubeColorId: 'cube-color-menu7',
        controlPanelId: 'cube-controls-menu7',
        statusId: 'cube-status-menu7',
        createdBy: 'Grok4.5'
    });

    const explodingFeature = renderCubesExplodingMenuPage(explodingSection);

    return {
        cubeFeature,
        explodingFeature,
        cleanup() {
            cubeFeature?.cleanup?.();
            explodingFeature?.dispose?.();
        }
    };
}
