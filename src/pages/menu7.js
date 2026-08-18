import { renderGrok3DCubePage } from '../grok-4.5/features/cube-3d/render3DCubePage.js';
import { renderCubesExplodingMenuPage } from '../grok-4.5/features/cubes-exploding/renderCubesExplodingMenuPage.js';

export function renderMenu7(container) {
    container.innerHTML = '';

    const cubeSection = document.createElement('section');
    const explodingSection = document.createElement('section');
    explodingSection.style.paddingTop = '16px';
    explodingSection.style.marginTop = '16px';
    explodingSection.style.borderTop = '1px solid #ccc';

    container.appendChild(cubeSection);
    container.appendChild(explodingSection);

    const cubeFeature = renderGrok3DCubePage(cubeSection);
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
