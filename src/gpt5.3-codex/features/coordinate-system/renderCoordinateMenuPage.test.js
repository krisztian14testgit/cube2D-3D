import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    initializeCoordinateMenuInteractions,
    renderCoordinateMenuPage
} from './renderCoordinateMenuPage.js';

describe('renderCoordinateMenuPage', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';

        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
            configurable: true,
            value: function getContext() {
                if (!this.__ctx) {
                    this.__ctx = {
                        beginPath: vi.fn(),
                        moveTo: vi.fn(),
                        lineTo: vi.fn(),
                        stroke: vi.fn(),
                        fillText: vi.fn(),
                        clearRect: vi.fn(),
                        strokeRect: vi.fn(),
                        font: '',
                        fillStyle: '',
                        strokeStyle: '',
                        lineWidth: 1
                    };
                }
                return this.__ctx;
            }
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders coordinate controls and updates drawing on changes', () => {
        const root = document.getElementById('root');
        renderCoordinateMenuPage(root, {
            title: 'Menu X',
            canvasId: 'canvas-x',
            hideGridId: 'hide-grid-x',
            sliderId: 'my-slider-x'
        });

        const canvas = root.querySelector('#canvas-x');
        const checkbox = root.querySelector('#hide-grid-x');
        const slider = root.querySelector('#my-slider-x');
        const ctx = canvas.getContext('2d');
        const clearCallsBefore = ctx.clearRect.mock.calls.length;

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        slider.value = '3';
        slider.dispatchEvent(new Event('change', { bubbles: true }));

        expect(root.textContent).toContain('Menu X');
        expect(ctx.clearRect.mock.calls.length).toBeGreaterThan(clearCallsBefore);
    });

    it('returns the created canvas and coordinate system instance', () => {
        const root = document.getElementById('root');
        const result = renderCoordinateMenuPage(root, {
            title: 'Menu Return',
            canvasId: 'canvas-return',
            hideGridId: 'hide-grid-return',
            sliderId: 'slider-return'
        });

        expect(result.canvas).toBe(root.querySelector('#canvas-return'));
        expect(result.coordSystem).toBeTruthy();
    });

    it('draws without grid when hide-grid checkbox is enabled', () => {
        const root = document.getElementById('root');
        const result = renderCoordinateMenuPage(root, {
            title: 'Menu Hide Grid',
            canvasId: 'canvas-hide-grid',
            hideGridId: 'hide-grid-hide-grid',
            sliderId: 'slider-hide-grid'
        });

        const drawWithoutGridSpy = vi.spyOn(result.coordSystem, 'drawWithoutGrid');
        const checkbox = root.querySelector('#hide-grid-hide-grid');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        expect(drawWithoutGridSpy).toHaveBeenCalled();
    });

    it('uses cubeScale multiplier on slider changes', () => {
        const root = document.getElementById('root');
        const result = renderCoordinateMenuPage(root, {
            title: 'Menu Scale',
            canvasId: 'canvas-scale',
            hideGridId: 'hide-grid-scale',
            sliderId: 'slider-scale',
            cubeScale: 2
        });

        const drawCubeSpy = vi.spyOn(result.coordSystem, 'drawCube');
        const slider = root.querySelector('#slider-scale');
        slider.value = '4';
        slider.dispatchEvent(new Event('change', { bubbles: true }));

        expect(drawCubeSpy).toHaveBeenCalledWith(10, 10, 8);
    });

    it('falls back to multiplier 1 when slider is missing', () => {
        const root = document.getElementById('root');
        root.innerHTML = '<canvas id="canvas-only"></canvas><input id="hide-grid-only" type="checkbox">';

        const result = initializeCoordinateMenuInteractions(root, {
            canvasId: 'canvas-only',
            hideGridId: 'hide-grid-only',
            sliderId: 'missing-slider',
            cubeScale: 3
        });

        const drawCubeSpy = vi.spyOn(result.coordSystem, 'drawCube');
        const checkbox = root.querySelector('#hide-grid-only');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        expect(drawCubeSpy).toHaveBeenCalledWith(10, 10, 3);
    });

    it('throws when target canvas element cannot be found', () => {
        const root = document.getElementById('root');
        root.innerHTML = '<input id="hide-grid-missing" type="checkbox"><input id="slider-missing" type="range" value="1">';

        expect(() =>
            initializeCoordinateMenuInteractions(root, {
                canvasId: 'missing-canvas',
                hideGridId: 'hide-grid-missing',
                sliderId: 'slider-missing'
            })
        ).toThrow('Canvas element not found');
    });
});
