import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    initialize3DCubeInteractions,
    render3DCubePage
} from './render3DCubePage.js';

describe('render3DCubePage (Grok4.5)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('creates cube on click and forwards control updates', () => {
        const root = document.getElementById('root');
        const mockController = {
            createCubeIfMissing: vi.fn()
                .mockReturnValueOnce(true)
                .mockReturnValue(false),
            setCubeScale: vi.fn(),
            setRotationAxis: vi.fn(),
            setRotationSpeed: vi.fn(),
            setCubeColor: vi.fn(),
            dispose: vi.fn()
        };
        const controllerFactory = vi.fn(() => mockController);

        const result = render3DCubePage(root, { controllerFactory });
        const canvas = root.querySelector('#canvas-menu7-3d');
        const panel = root.querySelector('#cube-controls-menu7');

        expect(panel.disabled).toBe(true);
        expect(root.innerHTML).toContain('Created by Grok4.5');

        canvas.dispatchEvent(new Event('click', { bubbles: true }));
        expect(mockController.createCubeIfMissing).toHaveBeenCalledTimes(1);
        expect(mockController.setCubeScale).toHaveBeenCalledWith(1);
        expect(panel.disabled).toBe(false);

        root.querySelector('#cube-scale-menu7').value = '2.4';
        root.querySelector('#cube-scale-menu7').dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setCubeScale).toHaveBeenLastCalledWith(2.4);

        root.querySelector('#cube-rotation-axis-menu7').value = 'z';
        root.querySelector('#cube-rotation-axis-menu7').dispatchEvent(new Event('change', { bubbles: true }));
        expect(mockController.setRotationAxis).toHaveBeenCalledWith('z');

        root.querySelector('#cube-rotation-speed-menu7').value = '4.2';
        root.querySelector('#cube-rotation-speed-menu7').dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setRotationSpeed).toHaveBeenCalledWith(4.2);

        root.querySelector('#cube-color-menu7').value = '#ff0000';
        root.querySelector('#cube-color-menu7').dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setCubeColor).toHaveBeenCalledWith('#ff0000');

        result.cleanup();
        expect(mockController.dispose).toHaveBeenCalledTimes(1);
        expect(controllerFactory).toHaveBeenCalledTimes(1);
    });

    it('throws when canvas is missing', () => {
        const root = document.getElementById('root');
        root.innerHTML = '<div>no canvas</div>';

        expect(() =>
            initialize3DCubeInteractions(root, {
                canvasId: 'missing-canvas',
                scaleId: 'missing-scale',
                rotationAxisId: 'missing-axis',
                rotationSpeedId: 'missing-speed',
                cubeColorId: 'missing-color',
                controlPanelId: 'missing-controls',
                statusId: 'missing-status',
                controllerFactory: vi.fn()
            })
        ).toThrow('Canvas element not found');
    });
});
