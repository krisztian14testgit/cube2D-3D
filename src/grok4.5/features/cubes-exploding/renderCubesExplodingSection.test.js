import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    GROK_CUBES_EXPLODING_DEFAULTS,
    appendCubesExplodingSection,
    createCubesExplodingMarkup,
    initializeCubesExplodingInteractions
} from './renderCubesExplodingSection.js';

describe('renderCubesExplodingSection', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('renders divider, header, and required controls', () => {
        const markup = createCubesExplodingMarkup(GROK_CUBES_EXPLODING_DEFAULTS);
        expect(markup).toContain('<hr');
        expect(markup).toContain(GROK_CUBES_EXPLODING_DEFAULTS.sectionTitle);
        expect(markup).toContain(GROK_CUBES_EXPLODING_DEFAULTS.sphereScaleId);
        expect(markup).toContain(GROK_CUBES_EXPLODING_DEFAULTS.maxCubesId);
        expect(markup).toContain(GROK_CUBES_EXPLODING_DEFAULTS.cameraRotationSpeedId);
        expect(markup).toContain('value="8"');
        expect(markup).toContain('value="10"');
        expect(markup).toContain('value="1"');
        expect(markup).toContain('min="10"');
        expect(markup).toContain('max="100"');
        expect(markup).toContain('Camera rotation speed');
    });

    it('wires controls to the controller and cleans up', () => {
        const root = document.getElementById('root');
        const mockController = {
            maxCubes: 10,
            getCubeCount: vi.fn(() => 0),
            setSphereScale: vi.fn(),
            setMaxCubes: vi.fn((value) => {
                mockController.maxCubes = value;
            }),
            setCameraRotationSpeed: vi.fn(),
            dispose: vi.fn()
        };
        const controllerFactory = vi.fn((canvas, options) => {
            mockController._options = options;
            options.onCubeCountChange?.(0, 10);
            return mockController;
        });

        const result = appendCubesExplodingSection(root, { controllerFactory });

        expect(root.querySelector('hr.feature-divider')).toBeTruthy();
        expect(root.querySelector('h2')?.textContent).toBe(GROK_CUBES_EXPLODING_DEFAULTS.sectionTitle);
        expect(controllerFactory).toHaveBeenCalledTimes(1);
        expect(controllerFactory.mock.calls[0][1].cameraRotationSpeed).toBe(1);

        const status = root.querySelector(`#${GROK_CUBES_EXPLODING_DEFAULTS.statusId}`);
        expect(status.textContent).toContain('Cubes: 0 / 10');

        const scaleInput = root.querySelector(`#${GROK_CUBES_EXPLODING_DEFAULTS.sphereScaleId}`);
        scaleInput.value = '11';
        scaleInput.dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setSphereScale).toHaveBeenCalledWith(11);
        expect(
            root.querySelector(`#${GROK_CUBES_EXPLODING_DEFAULTS.sphereScaleValueId}`).textContent
        ).toBe('11');

        const maxInput = root.querySelector(`#${GROK_CUBES_EXPLODING_DEFAULTS.maxCubesId}`);
        maxInput.value = '3';
        maxInput.dispatchEvent(new Event('change', { bubbles: true }));
        expect(mockController.setMaxCubes).toHaveBeenCalledWith(10);
        expect(maxInput.value).toBe('10');

        maxInput.value = '42';
        maxInput.dispatchEvent(new Event('change', { bubbles: true }));
        expect(mockController.setMaxCubes).toHaveBeenCalledWith(42);

        const rotationInput = root.querySelector(
            `#${GROK_CUBES_EXPLODING_DEFAULTS.cameraRotationSpeedId}`
        );
        rotationInput.value = '2.5';
        rotationInput.dispatchEvent(new Event('input', { bubbles: true }));
        expect(mockController.setCameraRotationSpeed).toHaveBeenCalledWith(2.5);
        expect(
            root.querySelector(`#${GROK_CUBES_EXPLODING_DEFAULTS.cameraRotationSpeedValueId}`)
                .textContent
        ).toBe('2.5');

        result.cleanup();
        expect(mockController.dispose).toHaveBeenCalledTimes(1);
    });

    it('throws when exploding canvas is missing', () => {
        const root = document.getElementById('root');
        root.innerHTML = '<div>no canvas</div>';

        expect(() =>
            initializeCubesExplodingInteractions(root, {
                canvasId: 'missing',
                sphereScaleId: 's',
                sphereScaleValueId: 'sv',
                maxCubesId: 'm',
                cameraRotationSpeedId: 'crs',
                cameraRotationSpeedValueId: 'crsv',
                statusId: 'st',
                controllerFactory: vi.fn()
            })
        ).toThrow('Exploding cubes canvas element not found');
    });
});
