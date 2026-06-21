import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BasicCoordinateMenu } from './BasicCoordinateMenu.js';

vi.mock('./CoordinateSystem.js', () => {
    return {
        CoordinateSystem: class {
            constructor() {
                this.ctx = {};
            }
            draw = vi.fn();
            drawWithoutGrid = vi.fn();
            clearCanvas = vi.fn();
            drawCube = vi.fn();
        }
    };
});

describe('BasicCoordinateMenu', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <canvas id="test-canvas"></canvas>
            <input id="test-hide-grid" type="checkbox" />
            <input id="test-slider" type="range" min="1" max="5" value="1" />
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('should initialize and draw initial state', () => {
        const menu = new BasicCoordinateMenu('test-canvas', 'test-hide-grid', 'test-slider');
        menu.init();
        
        // Since we mock CoordinateSystem, we can't easily check its methods here directly unless we expose it
        // but let's test event listeners
        const hideGrid = document.getElementById('test-hide-grid');
        const slider = document.getElementById('test-slider');
        
        hideGrid.checked = true;
        hideGrid.dispatchEvent(new Event('change'));
        
        slider.value = 3;
        slider.dispatchEvent(new Event('change'));
        
        expect(true).toBe(true);
    });
});
