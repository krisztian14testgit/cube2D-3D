import { describe, expect, it, vi } from 'vitest';
import {
    clampMaxCubeCount,
    collectCollisionIndexes,
    createRandomCubeState,
    shouldBounceFromBoundary
} from './CubesExplodingPhysics.js';

function createVector(x, y, z) {
    return {
        x,
        y,
        z,
        length() {
            return Math.hypot(this.x, this.y, this.z);
        },
        dot(other) {
            return this.x * other.x + this.y * other.y + this.z * other.z;
        }
    };
}

describe('Grok CubesExplodingPhysics', () => {
    it('clamps max cube count between 10 and 100', () => {
        expect(clampMaxCubeCount(1)).toBe(10);
        expect(clampMaxCubeCount(24)).toBe(24);
        expect(clampMaxCubeCount(120)).toBe(100);
        expect(clampMaxCubeCount(Number.NaN)).toBe(10);
    });

    it('creates random cube state within required ranges', () => {
        const randomValues = [0, 1, 0.5, 0.25, 0.75, 0.4, 0.6];
        const random = vi.fn(() => randomValues.shift() ?? 0.5);
        const cubeState = createRandomCubeState(createVector(1, 2, 3), random);

        expect(cubeState.scale).toBeGreaterThanOrEqual(1);
        expect(cubeState.scale).toBeLessThanOrEqual(5);
        expect(Math.abs(cubeState.velocity.x)).toBeLessThanOrEqual(0.08);
        expect(Math.abs(cubeState.velocity.y)).toBeLessThanOrEqual(0.08);
        expect(Math.abs(cubeState.velocity.z)).toBeLessThanOrEqual(0.08);
        expect(Math.abs(cubeState.rotationVelocity.x)).toBeLessThanOrEqual(0.03);
        expect(Math.abs(cubeState.rotationVelocity.y)).toBeLessThanOrEqual(0.03);
        expect(Math.abs(cubeState.rotationVelocity.z)).toBeLessThanOrEqual(0.03);
    });

    it('collects colliding cube indexes in descending order', () => {
        const cubes = [
            { position: createVector(0, 0, 0), collisionRadius: 2 },
            { position: createVector(2, 0, 0), collisionRadius: 2 },
            { position: createVector(20, 0, 0), collisionRadius: 1 }
        ];

        expect(collectCollisionIndexes(cubes)).toEqual([1, 0]);
    });

    it('returns true when cube reaches boundary and moves outward', () => {
        const position = createVector(7.5, 0, 0);
        const velocity = createVector(0.6, 0, 0);
        const shouldBounce = shouldBounceFromBoundary(position, velocity, 8, 0.5);

        expect(shouldBounce).toBe(true);
    });

    it('returns false for inward direction at boundary', () => {
        const position = createVector(7.5, 0, 0);
        const velocity = createVector(-0.6, 0, 0);
        const shouldBounce = shouldBounceFromBoundary(position, velocity, 8, 0.5);

        expect(shouldBounce).toBe(false);
    });
});
