import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BasicCoordinateMenu } from './BasicCoordinateMenu.js';
import { CoordinateSystem } from './CoordinateSystem.js';

const mockDraw = vi.fn();
const mockDrawWithoutGrid = vi.fn();
const mockClearCanvas = vi.fn();
const mockDrawCube = vi.fn();

vi.mock('./CoordinateSystem.js', () => {
    return {
        CoordinateSystem: class {
            constructor(params) {
                this.params = params;
            }
            draw = mockDraw;
            drawWithoutGrid = mockDrawWithoutGrid;
            clearCanvas = mockClearCanvas;
            drawCube = mockDrawCube;
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
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('should initialize and call CoordinateSystem methods correctly', () => {
        const menu = new BasicCoordinateMenu('test-canvas', 'test-hide-grid', 'test-slider');
        menu.init();
        
        expect(mockDraw).toHaveBeenCalled();
        expect(mockDrawCube).toHaveBeenCalledWith(10, 10, 1);
        
        const hideGrid = document.getElementById('test-hide-grid');
        const slider = document.getElementById('test-slider');
        
        hideGrid.checked = true;
        hideGrid.dispatchEvent(new Event('change'));
        
        expect(mockClearCanvas).toHaveBeenCalled();
        expect(mockDrawWithoutGrid).toHaveBeenCalled();
        expect(mockDrawCube).toHaveBeenCalledWith(10, 10, 1);
        
        slider.value = 3;
        slider.dispatchEvent(new Event('change'));
        
        expect(mockClearCanvas).toHaveBeenCalledTimes(2);
        expect(mockDrawWithoutGrid).toHaveBeenCalledTimes(2);
        expect(mockDrawCube).toHaveBeenCalledWith(10, 10, 3);
    });
});
