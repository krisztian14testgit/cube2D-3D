import { beforeEach, describe, expect, it, vi } from 'vitest';

const render3DCubePageSpy = vi.fn();
const renderCubesExplodingMenuPageSpy = vi.fn();
const cubeCleanupSpy = vi.fn();
const explodingDisposeSpy = vi.fn();

vi.mock('../grok4.5/features/cube-3d/render3DCubePage.js', () => ({
    render3DCubePage: (...args) => render3DCubePageSpy(...args)
}));

vi.mock('../grok4.5/features/cubes-exploding/renderCubesExplodingMenuPage.js', () => ({
    renderCubesExplodingMenuPage: (...args) => renderCubesExplodingMenuPageSpy(...args)
}));

import { renderMenu7 } from './menu7.js';

describe('renderMenu7', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        cubeCleanupSpy.mockReset();
        explodingDisposeSpy.mockReset();
        render3DCubePageSpy.mockReset().mockReturnValue({ cleanup: cubeCleanupSpy });
        renderCubesExplodingMenuPageSpy.mockReset().mockReturnValue({ dispose: explodingDisposeSpy });
    });

    it('renders cube and exploding sections under menu7', () => {
        const root = document.getElementById('root');

        const result = renderMenu7(root);
        const sections = root.querySelectorAll('section');

        expect(render3DCubePageSpy).toHaveBeenCalledTimes(1);
        expect(renderCubesExplodingMenuPageSpy).toHaveBeenCalledTimes(1);
        expect(sections.length).toBe(2);
        expect(sections[1].style.borderTop).toBe('1px solid rgb(204, 204, 204)');
        expect(result.cubeFeature).toBeTruthy();
        expect(result.explodingFeature).toBeTruthy();

        const cubeOptions = render3DCubePageSpy.mock.calls[0][1];
        expect(cubeOptions.title).toBe('Grok4.5 - 3D babylonjs');
        expect(cubeOptions.createdBy).toBe('Grok4.5');
    });

    it('cleans up both features', () => {
        const root = document.getElementById('root');
        const result = renderMenu7(root);

        result.cleanup();

        expect(cubeCleanupSpy).toHaveBeenCalledTimes(1);
        expect(explodingDisposeSpy).toHaveBeenCalledTimes(1);
    });
});
