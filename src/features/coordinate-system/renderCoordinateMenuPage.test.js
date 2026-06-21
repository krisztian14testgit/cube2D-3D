import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderCoordinateMenuPage } from './renderCoordinateMenuPage.js';

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
});
