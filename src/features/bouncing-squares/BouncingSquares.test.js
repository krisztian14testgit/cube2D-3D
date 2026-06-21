import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BouncingSquares } from './BouncingSquares.js';

vi.mock('../coordinate-system/CoordinateSystem.js', () => {
    return {
        CoordinateSystem: class {
            constructor() {
                this.ctx = {
                    save: vi.fn(),
                    translate: vi.fn(),
                    rotate: vi.fn(),
                    strokeRect: vi.fn(),
                    restore: vi.fn()
                };
            }
            draw = vi.fn();
            clearCanvas = vi.fn();
        }
    };
});

describe('BouncingSquares', () => {
    let canvas;
    
    beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.id = 'test-canvas';
        canvas.width = 500;
        canvas.height = 500;
        document.body.appendChild(canvas);
        
        canvas.getBoundingClientRect = vi.fn(() => ({
            left: 0,
            top: 0,
            right: 500,
            bottom: 500,
            width: 500,
            height: 500
        }));

        vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 0)));
        vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)));
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.unstubAllGlobals();
    });

    it('should add a square when addSquare is called', () => {
        const bouncing = new BouncingSquares('test-canvas');
        expect(bouncing.squares.length).toBe(0);
        
        bouncing.addSquare(100, 100);
        expect(bouncing.squares.length).toBe(1);
        expect(bouncing.squares[0].x).toBe(100);
        expect(bouncing.squares[0].y).toBe(100);
    });

    it('should add a square on canvas click', () => {
        const bouncing = new BouncingSquares('test-canvas');
        
        const event = new MouseEvent('click', { clientX: 150, clientY: 150 });
        canvas.dispatchEvent(event);
        
        expect(bouncing.squares.length).toBe(1);
        expect(bouncing.squares[0].x).toBe(150);
        expect(bouncing.squares[0].y).toBe(150);
    });
});
