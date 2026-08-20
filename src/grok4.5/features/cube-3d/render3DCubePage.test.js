import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    GROK_MENU7_DEFAULTS,
    initialize3DCubeInteractions,
    render3DCubePage
} from './render3DCubePage.js';

describe('render3DCubePage', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('renders menu7 defaults and keeps controls disabled until cube creation', () => {
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
        const canvas = root.querySelector(`#${GROK_MENU7_DEFAULTS.canvasId}`);
        const panel = root.querySelector(`#${GROK_MENU7_DEFAULTS.controlPanelId}`);
        const status = root.querySelector(`#${GROK_MENU7_DEFAULTS.statusId}`);

        expect(root.querySelector('h2')?.textContent).toBe(GROK_MENU7_DEFAULTS.title);
        expect(panel.disabled).toBe(true);
        expect(status.textContent).toContain('Click the canvas');

        canvas.dispatchEvent(new Event('click', { bubbles: true }));
        expect(mockController.createCubeIfMissing).toHaveBeenCalledTimes(1);
        expect(mockController.setCubeScale).toHaveBeenCalledWith(1);
        expect(panel.disabled).toBe(false);
        expect(status.textContent).toContain('Cube is active');

        root.querySelector(`#${GROK_MENU7_DEFAULTS.scaleId}`).value = '2.4';
        root.querySelector(`#${GROK_MENU7_DEFAULTS.scaleId}`).dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setCubeScale).toHaveBeenLastCalledWith(2.4);

        root.querySelector(`#${GROK_MENU7_DEFAULTS.rotationAxisId}`).value = 'z';
        root.querySelector(`#${GROK_MENU7_DEFAULTS.rotationAxisId}`).dispatchEvent(new Event('change', { bubbles: true }));
        expect(mockController.setRotationAxis).toHaveBeenCalledWith('z');

        root.querySelector(`#${GROK_MENU7_DEFAULTS.rotationSpeedId}`).value = '4.2';
        root.querySelector(`#${GROK_MENU7_DEFAULTS.rotationSpeedId}`).dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setRotationSpeed).toHaveBeenCalledWith(4.2);

        root.querySelector(`#${GROK_MENU7_DEFAULTS.cubeColorId}`).value = '#ff0000';
        root.querySelector(`#${GROK_MENU7_DEFAULTS.cubeColorId}`).dispatchEvent(new Event('input', { bubbles: true }));
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
