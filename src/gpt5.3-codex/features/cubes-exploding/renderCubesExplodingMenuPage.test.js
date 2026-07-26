import { beforeEach, describe, expect, it, vi } from 'vitest';

const initializeSpy = vi.fn();
const bindControlsSpy = vi.fn();

vi.mock('./CubesExplodingScene.js', () => ({
    CUBES_EXPLODING_DEFAULTS: {
        sphereScale: 8,
        maxCubes: 10,
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

describe('renderCubesExplodingMenuPage', () => {
    beforeEach(() => {
        initializeSpy.mockClear();
        bindControlsSpy.mockClear();
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('creates markup with required control panel fields', () => {
        const markup = createCubesExplodingMarkup();

        expect(markup).toContain('Sphere Scale');
        expect(markup).toContain('Max Cubes (10 - 100)');
        expect(markup).toContain('gpt-cubes-render-canvas');
    });

    it('renders scene and binds controls', () => {
        const root = document.getElementById('root');
        const scene = renderCubesExplodingMenuPage(root);

        expect(scene).toBeTruthy();
        expect(initializeSpy).toHaveBeenCalledTimes(1);
        expect(bindControlsSpy).toHaveBeenCalledWith(root);
    });
});
