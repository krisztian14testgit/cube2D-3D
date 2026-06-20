import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMenu1 } from './menu1.js';

describe('renderMenu1 - step 2 implementation', () => {
    let rafCallback = null;

    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';

        vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
            rafCallback = cb;
            return 1;
        }));

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
                        save: vi.fn(),
                        translate: vi.fn(),
                        rotate: vi.fn(),
                        strokeRect: vi.fn(),
                        restore: vi.fn(),
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
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('renders step1 and step2 sections with two canvases', () => {
        const root = document.getElementById('root');
        renderMenu1(root);

        expect(root.querySelector('h3')?.textContent).toContain('Step 1');
        expect(root.textContent).toContain('Step 2 - Bouncing & Rotating Squares');
        expect(root.querySelector('hr')).not.toBeNull();
        expect(root.querySelector('#canvas-menu1')).not.toBeNull();
        expect(root.querySelector('#canvas-menu2')).not.toBeNull();
    });

    it('draws rotating square after click and animation tick', () => {
        const root = document.getElementById('root');
        renderMenu1(root);

        const canvas = root.querySelector('#canvas-menu2');
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0 });
        canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 140 }));

        if (rafCallback) {
            rafCallback();
        }

        const ctx = canvas.getContext('2d');
        expect(ctx.strokeRect).toHaveBeenCalled();
    });
});
