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

        vi.useFakeTimers();
        vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)));
        vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)));
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should add a square when addSquare is called', () => {
        const expectedInitialSquaresCount = 0;
        const expectedSquaresCount = 1;
        const expectedX = 100;
        const expectedY = 100;

        const bouncing = new BouncingSquares('test-canvas');
        expect(bouncing.squares.length).toBe(expectedInitialSquaresCount);
        
        bouncing.addSquare(100, 100);
        expect(bouncing.squares.length).toBe(expectedSquaresCount);
        expect(bouncing.squares[0].x).toBe(expectedX);
        expect(bouncing.squares[0].y).toBe(expectedY);
    });

    it('should add a square on canvas click', () => {
        const expectedSquaresCount = 1;
        const expectedX = 150;
        const expectedY = 150;

        const bouncing = new BouncingSquares('test-canvas');
        
        const event = new MouseEvent('click', { clientX: 150, clientY: 150 });
        canvas.dispatchEvent(event);
        
        expect(bouncing.squares.length).toBe(expectedSquaresCount);
        expect(bouncing.squares[0].x).toBe(expectedX);
        expect(bouncing.squares[0].y).toBe(expectedY);
    });

    it('should start animation loop and update physics', () => {
        const bouncing = new BouncingSquares('test-canvas');
        bouncing.addSquare(100, 100);
        const sq = bouncing.squares[0];
        const initialX = sq.x;
        const initialAngle = sq.angle;
        
        // startAnimation calls animate synchronously once, updating physics immediately
        bouncing.startAnimation();
        
        expect(sq.x).toBe(initialX + sq.dx);
        expect(sq.angle).toBe(initialAngle + sq.rotationSpeed);
        
        const nextX = sq.x;
        const nextAngle = sq.angle;
        
        // Advance timers to trigger the next requestAnimationFrame callback
        vi.advanceTimersByTime(16);
        
        expect(sq.x).toBe(nextX + sq.dx);
        expect(sq.angle).toBe(nextAngle + sq.rotationSpeed);
        
        bouncing.stopAnimation();
    });
});
