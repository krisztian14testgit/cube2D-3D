import { render3DCubePage } from '../gpt5.3-codex/features/cube-3d/render3DCubePage.js';
import { renderCubesExplodingMenuPage } from '../gpt5.3-codex/features/cubes-exploding/renderCubesExplodingMenuPage.js';

export function renderMenu6(container) {
    container.innerHTML = '';

    const cubeSection = document.createElement('section');
    const explodingSection = document.createElement('section');
    explodingSection.style.paddingTop = '16px';
    explodingSection.style.marginTop = '16px';
    explodingSection.style.borderTop = '1px solid #ccc';

    container.appendChild(cubeSection);
    container.appendChild(explodingSection);

    const cubeFeature = render3DCubePage(cubeSection, {
        title: 'GPT5.3-codex - 3D cube',
        canvasId: 'canvas-menu6-3d',
        scaleId: 'cube-scale-menu6',
        rotationAxisId: 'cube-rotation-axis-menu6',
        rotationSpeedId: 'cube-rotation-speed-menu6',
        cubeColorId: 'cube-color-menu6',
        controlPanelId: 'cube-controls-menu6',
        statusId: 'cube-status-menu6'
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
