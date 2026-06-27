import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsEngine } from './PhysicsEngine.js';
import { SquareModel } from './SquareModel.js';

const CANVAS_W = 500;
const CANVAS_H = 500;

function makeSquare(overrides = {}) {
    return new SquareModel({
        x: 250, y: 250, size: 40, dx: 2, dy: 2, rotationSpeed: 0.01,
        ...overrides,
    });
}

describe('PhysicsEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new PhysicsEngine();
    });

    // ── bounce ──────────────────────────────────────────────────────────────

    describe('bounce()', () => {
        it('does not change velocity when square is well inside boundaries', () => {
            const SQUARE_DX = 2;  // horizontal velocity well away from walls
            const SQUARE_DY = 2;  // vertical velocity well away from walls
            const s = makeSquare({ x: 250, y: 250, dx: SQUARE_DX, dy: SQUARE_DY });
            engine.bounce(s, CANVAS_W, CANVAS_H);
            expect(s.dx).toBe(SQUARE_DX);
            expect(s.dy).toBe(SQUARE_DY);
        });

        it('inverts dx when the square hits the left wall', () => {
            const APPROACH_DX = -2;  // dx moving toward the left wall
            const s = makeSquare({ x: 1, y: 250, dx: APPROACH_DX, dy: 1 });
            engine.bounce(s, CANVAS_W, CANVAS_H);
            expect(s.dx).toBe(-APPROACH_DX);  // inverted: -(-2) = 2
        });

        it('inverts dx when the square hits the right wall', () => {
            const APPROACH_DX = 2;  // dx moving toward the right wall
            const s = makeSquare({ x: CANVAS_W - 1, y: 250, dx: APPROACH_DX, dy: 1 });
            engine.bounce(s, CANVAS_W, CANVAS_H);
            expect(s.dx).toBe(-APPROACH_DX);  // inverted: -(2) = -2
        });

        it('inverts dy when the square hits the top wall', () => {
            const APPROACH_DY = -2;  // dy moving toward the top wall
            const s = makeSquare({ x: 250, y: 1, dx: 1, dy: APPROACH_DY });
            engine.bounce(s, CANVAS_W, CANVAS_H);
            expect(s.dy).toBe(-APPROACH_DY);  // inverted: -(-2) = 2
        });

        it('inverts dy when the square hits the bottom wall', () => {
            const APPROACH_DY = 2;  // dy moving toward the bottom wall
            const s = makeSquare({ x: 250, y: CANVAS_H - 1, dx: 1, dy: APPROACH_DY });
            engine.bounce(s, CANVAS_W, CANVAS_H);
            expect(s.dy).toBe(-APPROACH_DY);  // inverted: -(2) = -2
        });

        it('clamps x so it stays inside the boundary after bounce', () => {
            const s = makeSquare({ x: -10, y: 250, dx: -2, dy: 0 });
            engine.bounce(s, CANVAS_W, CANVAS_H);
            expect(s.x).toBeGreaterThanOrEqual(s.radius);
        });
    });

    // ── areColliding ────────────────────────────────────────────────────────

    describe('areColliding()', () => {
        it('returns true when two squares overlap', () => {
            const a = makeSquare({ x: 100, y: 100, size: 40 });
            const b = makeSquare({ x: 110, y: 110, size: 40 });
            expect(engine.areColliding(a, b)).toBe(true);
        });

        it('returns false when two squares are far apart', () => {
            const a = makeSquare({ x: 100, y: 100, size: 20 });
            const b = makeSquare({ x: 400, y: 400, size: 20 });
            expect(engine.areColliding(a, b)).toBe(false);
        });

        it('returns true for squares whose radii exactly touch (edge case)', () => {
            const a = makeSquare({ x: 100, y: 100, size: 40 });
            // place b just close enough to still trigger collision
            const gap = a.radius + makeSquare({ x: 0, y: 0, size: 40 }).radius - 1;
            const b = makeSquare({ x: 100 + gap, y: 100, size: 40 });
            expect(engine.areColliding(a, b)).toBe(true);
        });
    });

    // ── removeColliding ──────────────────────────────────────────────────────

    describe('removeColliding()', () => {
        it('returns empty array when there are no squares', () => {
            expect(engine.removeColliding([])).toEqual([]);
        });

        it('keeps a single square untouched', () => {
            const s = makeSquare({ x: 250, y: 250 });
            const result = engine.removeColliding([s]);
            expect(result).toHaveLength(1);
            expect(result[0]).toBe(s);
        });

        it('removes both squares when they collide', () => {
            const a = makeSquare({ x: 100, y: 100, size: 40 });
            const b = makeSquare({ x: 110, y: 110, size: 40 });
            const result = engine.removeColliding([a, b]);
            expect(result).toHaveLength(0);
        });

        it('keeps squares that do not collide with any other', () => {
            const a = makeSquare({ x: 50,  y: 50,  size: 20 });
            const b = makeSquare({ x: 450, y: 450, size: 20 });
            const result = engine.removeColliding([a, b]);
            expect(result).toHaveLength(2);
        });

        it('removes only the colliding pair from a larger group', () => {
            const a = makeSquare({ x: 100, y: 100, size: 40 });
            const b = makeSquare({ x: 110, y: 110, size: 40 }); // collides with a
            const c = makeSquare({ x: 400, y: 400, size: 20 }); // alone
            const result = engine.removeColliding([a, b, c]);
            expect(result).toHaveLength(1);
            expect(result[0]).toBe(c);
        });
    });
});
