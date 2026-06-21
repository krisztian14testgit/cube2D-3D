import { describe, it, expect, beforeEach } from 'vitest';
import { SquareModel } from './SquareModel.js';

describe('SquareModel', () => {
    let square;

    beforeEach(() => {
        square = new SquareModel({ x: 100, y: 100, size: 40, dx: 2, dy: -3, rotationSpeed: 0.05 });
    });

    it('initialises with the given properties', () => {
        expect(square.x).toBe(100);
        expect(square.y).toBe(100);
        expect(square.size).toBe(40);
        expect(square.dx).toBe(2);
        expect(square.dy).toBe(-3);
        expect(square.angle).toBe(0);
        expect(square.rotationSpeed).toBe(0.05);
    });

    it('defaults angle to 0 when not provided', () => {
        const s = new SquareModel({ x: 0, y: 0, size: 20, dx: 1, dy: 1, rotationSpeed: 0.01 });
        expect(s.angle).toBe(0);
    });

    it('update() moves position by velocity', () => {
        square.update();
        expect(square.x).toBe(102);
        expect(square.y).toBe(97);
    });

    it('update() advances angle by rotationSpeed', () => {
        square.update();
        expect(square.angle).toBeCloseTo(0.05);
    });

    it('update() accumulates over multiple frames', () => {
        square.update();
        square.update();
        expect(square.x).toBe(104);
        expect(square.y).toBe(94);
        expect(square.angle).toBeCloseTo(0.1);
    });

    it('radius equals half the diagonal of the square', () => {
        const expected = (40 * Math.SQRT2) / 2;
        expect(square.radius).toBeCloseTo(expected);
    });
});
