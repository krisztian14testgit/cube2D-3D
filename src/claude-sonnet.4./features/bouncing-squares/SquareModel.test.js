import { describe, it, expect, beforeEach } from 'vitest';
import { SquareModel } from './SquareModel.js';

describe('SquareModel', () => {
    let square;

    // Named constants describing the square created in beforeEach
    const INITIAL_X = 100;                // centre X position (pixels)
    const INITIAL_Y = 100;                // centre Y position (pixels)
    const INITIAL_SIZE = 40;              // side length (pixels)
    const INITIAL_DX = 2;                 // horizontal velocity (pixels/frame)
    const INITIAL_DY = -3;               // vertical velocity, upward (pixels/frame)
    const INITIAL_ROTATION_SPEED = 0.05; // rotation delta per frame (radians)
    const DEFAULT_ANGLE = 0;             // default initial rotation (radians)

    beforeEach(() => {
        square = new SquareModel({ x: INITIAL_X, y: INITIAL_Y, size: INITIAL_SIZE, dx: INITIAL_DX, dy: INITIAL_DY, rotationSpeed: INITIAL_ROTATION_SPEED });
    });

    it('initialises with the given properties', () => {
        expect(square.x).toBe(INITIAL_X);
        expect(square.y).toBe(INITIAL_Y);
        expect(square.size).toBe(INITIAL_SIZE);
        expect(square.dx).toBe(INITIAL_DX);
        expect(square.dy).toBe(INITIAL_DY);
        expect(square.angle).toBe(DEFAULT_ANGLE);
        expect(square.rotationSpeed).toBe(INITIAL_ROTATION_SPEED);
    });

    it('defaults angle to 0 when not provided', () => {
        const s = new SquareModel({ x: 0, y: 0, size: 20, dx: 1, dy: 1, rotationSpeed: 0.01 });
        expect(s.angle).toBe(DEFAULT_ANGLE);
    });

    it('update() moves position by velocity', () => {
        square.update();
        expect(square.x).toBe(INITIAL_X + INITIAL_DX);   // 100 + 2 = 102
        expect(square.y).toBe(INITIAL_Y + INITIAL_DY);    // 100 + (-3) = 97
    });

    it('update() advances angle by rotationSpeed', () => {
        square.update();
        expect(square.angle).toBeCloseTo(INITIAL_ROTATION_SPEED);
    });

    it('update() accumulates over multiple frames', () => {
        square.update();
        square.update();
        expect(square.x).toBe(INITIAL_X + 2 * INITIAL_DX);           // 100 + 2*2 = 104
        expect(square.y).toBe(INITIAL_Y + 2 * INITIAL_DY);            // 100 + 2*(-3) = 94
        expect(square.angle).toBeCloseTo(2 * INITIAL_ROTATION_SPEED); // 2 * 0.05 = 0.1
    });

    it('radius equals half the diagonal of the square', () => {
        const expected = (INITIAL_SIZE * Math.SQRT2) / 2;
        expect(square.radius).toBeCloseTo(expected);
    });
});
