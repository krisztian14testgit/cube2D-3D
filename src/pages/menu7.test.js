import { beforeEach, describe, expect, it, vi } from 'vitest';

const render3DCubePageSpy = vi.fn();
const cleanupSpy = vi.fn();

vi.mock('../grok-4.5/features/cube-3d/render3DCubePage.js', () => ({
    render3DCubePage: (...args) => render3DCubePageSpy(...args)
}));

import { renderMenu7 } from './menu7.js';

describe('renderMenu7', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        cleanupSpy.mockReset();
        render3DCubePageSpy.mockReset().mockReturnValue({ cleanup: cleanupSpy });
    });

    it('renders the Grok 4.5 3D cube feature with menu7 ids', () => {
        const root = document.getElementById('root');

        const result = renderMenu7(root);

        expect(render3DCubePageSpy).toHaveBeenCalledTimes(1);
        expect(render3DCubePageSpy).toHaveBeenCalledWith(root, {
            title: 'Grok4.5 - 3D cube',
            canvasId: 'canvas-menu7-3d',
            scaleId: 'cube-scale-menu7',
            rotationAxisId: 'cube-rotation-axis-menu7',
            rotationSpeedId: 'cube-rotation-speed-menu7',
            cubeColorId: 'cube-color-menu7',
            controlPanelId: 'cube-controls-menu7',
            statusId: 'cube-status-menu7',
            createdBy: 'Grok 4.5'
        });
        expect(result.cleanup).toBe(cleanupSpy);
    });

    it('exposes cleanup from the feature', () => {
        const root = document.getElementById('root');
        const result = renderMenu7(root);

        result.cleanup();

        expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });
});
