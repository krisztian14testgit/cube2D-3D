import { beforeEach, describe, expect, it, vi } from 'vitest';

const initializeSpy = vi.fn();
const bindControlsSpy = vi.fn();

vi.mock('./CubesExplodingScene.js', () => ({
    CUBES_EXPLODING_DEFAULTS: {
        sphereScale: 8,
        maxCubes: 10,
        cameraRotationSpeed: 1,
        minCameraRotationSpeed: 0.4,
        maxCameraRotationSpeed: 3,
        minMaxCubes: 10,
        maxMaxCubes: 100
    },
    CubesExplodingScene: class {
        constructor(canvas) {
            this.canvas = canvas;
        }

        initialize() {
            initializeSpy();
        }

        bindControls(container) {
            bindControlsSpy(container);
        }
    }
}));

import {
    createCubesExplodingMarkup,
    renderCubesExplodingMenuPage
} from './renderCubesExplodingMenuPage.js';

describe('Grok renderCubesExplodingMenuPage', () => {
    beforeEach(() => {
        initializeSpy.mockClear();
        bindControlsSpy.mockClear();
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('creates markup with required control panel fields', () => {
        const markup = createCubesExplodingMarkup();

        expect(markup).toContain('Sphere Scale');
        expect(markup).toContain('Max Cubes (10 - 100)');
        expect(markup).toContain('Camera Rotation Speed');
        expect(markup).toContain('grok-cubes-render-canvas');
        expect(markup).toContain('value="8"');
        expect(markup).toContain('Created by Grok 4.5');
        expect(markup).toContain('Exploding Cubes in Sphere Boundary');
    });

    it('renders scene and binds controls', () => {
        const root = document.getElementById('root');
        const scene = renderCubesExplodingMenuPage(root);

        expect(scene).toBeTruthy();
        expect(initializeSpy).toHaveBeenCalledTimes(1);
        expect(bindControlsSpy).toHaveBeenCalledWith(root);
    });

    it('returns null when canvas cannot be found', () => {
        const fakeContainer = {
            innerHTML: '',
            querySelector: vi.fn(() => null)
        };

        const scene = renderCubesExplodingMenuPage(fakeContainer);
        expect(scene).toBeNull();
        expect(initializeSpy).not.toHaveBeenCalled();
    });
});
