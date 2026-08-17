import { beforeEach, describe, expect, it, vi } from 'vitest';

const render3DCubePageSpy = vi.fn();
const renderCubesExplodingMenuPageSpy = vi.fn();
const cubeCleanupSpy = vi.fn();
const explodingDisposeSpy = vi.fn();

vi.mock('../gpt5.3-codex/features/cube-3d/render3DCubePage.js', () => ({
    render3DCubePage: (...args) => render3DCubePageSpy(...args)
}));

vi.mock('../gpt5.3-codex/features/cubes-exploding/renderCubesExplodingMenuPage.js', () => ({
    renderCubesExplodingMenuPage: (...args) => renderCubesExplodingMenuPageSpy(...args)
}));

import { renderMenu6 } from './menu6.js';

describe('renderMenu6', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        cubeCleanupSpy.mockClear();
        explodingDisposeSpy.mockClear();
        render3DCubePageSpy.mockReset().mockReturnValue({ cleanup: cubeCleanupSpy });
        renderCubesExplodingMenuPageSpy.mockReset().mockReturnValue({ dispose: explodingDisposeSpy });
    });

    it('renders cube and exploding sections under menu6', () => {
        const root = document.getElementById('root');

        const result = renderMenu6(root);

        expect(render3DCubePageSpy).toHaveBeenCalledTimes(1);
        expect(renderCubesExplodingMenuPageSpy).toHaveBeenCalledTimes(1);
        expect(root.querySelectorAll('section').length).toBe(2);
        expect(result.cubeFeature).toBeTruthy();
        expect(result.explodingFeature).toBeTruthy();
    });

    it('cleans up both features', () => {
        const root = document.getElementById('root');
        const result = renderMenu6(root);

        result.cleanup();

        expect(cubeCleanupSpy).toHaveBeenCalledTimes(1);
        expect(explodingDisposeSpy).toHaveBeenCalledTimes(1);
    });
});
