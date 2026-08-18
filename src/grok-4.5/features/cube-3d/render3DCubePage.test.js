import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    initialize3DCubeInteractions,
    render3DCubePage
} from './render3DCubePage.js';

describe('render3DCubePage (Grok 4.5)', () => {
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

        const ids = {
            canvasId: 'test-canvas-menu7-3d',
            scaleId: 'test-cube-scale-menu7',
            rotationAxisId: 'test-cube-rotation-axis-menu7',
            rotationSpeedId: 'test-cube-rotation-speed-menu7',
            cubeColorId: 'test-cube-color-menu7',
            controlPanelId: 'test-cube-controls-menu7',
            statusId: 'test-cube-status-menu7'
        };

        const result = render3DCubePage(root, { ...ids, controllerFactory });
        const canvas = root.querySelector(`#${ids.canvasId}`);
        const panel = root.querySelector(`#${ids.controlPanelId}`);

        expect(root.textContent).toContain('Created by Grok 4.5');
        expect(panel.disabled).toBe(true);

        canvas.dispatchEvent(new Event('click', { bubbles: true }));
        expect(mockController.createCubeIfMissing).toHaveBeenCalledTimes(1);
        expect(mockController.setCubeScale).toHaveBeenCalledWith(1);
        expect(panel.disabled).toBe(false);

        root.querySelector(`#${ids.scaleId}`).value = '2.4';
        root.querySelector(`#${ids.scaleId}`).dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setCubeScale).toHaveBeenLastCalledWith(2.4);

        root.querySelector(`#${ids.rotationAxisId}`).value = 'z';
        root.querySelector(`#${ids.rotationAxisId}`).dispatchEvent(new Event('change', { bubbles: true }));
        expect(mockController.setRotationAxis).toHaveBeenCalledWith('z');

        root.querySelector(`#${ids.rotationSpeedId}`).value = '4.2';
        root.querySelector(`#${ids.rotationSpeedId}`).dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setRotationSpeed).toHaveBeenCalledWith(4.2);

        root.querySelector(`#${ids.cubeColorId}`).value = '#ff0000';
        root.querySelector(`#${ids.cubeColorId}`).dispatchEvent(new Event('input', { bubbles: true }));
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
