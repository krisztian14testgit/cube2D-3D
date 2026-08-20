import { describe, expect, it } from 'vitest';
import {
    DEFAULT_MAX_CUBES,
    DEFAULT_SPHERE_SCALE,
    MAX_MAX_CUBES,
    MIN_MAX_CUBES,
    bounceVelocity,
    clampMaxCubes,
    clampPointInsideSphere,
    collectCollisionIndexes,
    cubeHalfExtent,
    distance3,
    randomCubeScale,
    randomRotationSpeed,
    randomVelocity,
    shouldBounceOffSphere,
    sortIndexesDescending
} from './cubesExplodingMath.js';

describe('cubesExplodingMath', () => {
    it('exposes expected defaults', () => {
        expect(DEFAULT_SPHERE_SCALE).toBe(8);
        expect(DEFAULT_MAX_CUBES).toBe(10);
        expect(MIN_MAX_CUBES).toBe(10);
        expect(MAX_MAX_CUBES).toBe(100);
    });

    it('clamps max cubes into [10, 100]', () => {
        expect(clampMaxCubes(5)).toBe(10);
        expect(clampMaxCubes(10)).toBe(10);
        expect(clampMaxCubes(55)).toBe(55);
        expect(clampMaxCubes(100)).toBe(100);
        expect(clampMaxCubes(250)).toBe(100);
        expect(clampMaxCubes('12.6')).toBe(13);
        expect(clampMaxCubes(Number.NaN)).toBe(10);
    });

    it('generates random cube scales inside [1, 5]', () => {
        const values = [0, 0.25, 0.5, 0.75, 0.999];
        let index = 0;
        const rng = () => values[index++];

        const scales = values.map(() => randomCubeScale(1, 5, rng));
        for (const scale of scales) {
            expect(scale).toBeGreaterThanOrEqual(1);
            expect(scale).toBeLessThanOrEqual(5);
        }
        expect(scales[0]).toBeCloseTo(1);
        expect(scales[2]).toBeCloseTo(3);
    });

    it('builds random velocity and rotation vectors', () => {
        const rng = () => 1;
        expect(randomVelocity(rng, 0.1)).toEqual({ x: 0.1, y: 0.1, z: 0.1 });
        expect(randomRotationSpeed(rng, 0.2)).toEqual({ x: 0.2, y: 0.2, z: 0.2 });
    });

    it('collects collision indexes and sorts them descending for safe removal', () => {
        const cubes = [
            { x: 0, y: 0, z: 0, halfExtent: 1 },
            { x: 10, y: 0, z: 0, halfExtent: 1 },
            { x: 0.5, y: 0, z: 0, halfExtent: 1 },
            { x: 20, y: 0, z: 0, halfExtent: 1 }
        ];

        const indexes = collectCollisionIndexes(cubes);
        expect(indexes.sort((a, b) => a - b)).toEqual([0, 2]);
        expect(sortIndexesDescending(indexes)).toEqual([2, 0]);
    });

    it('computes distances and half extents', () => {
        expect(distance3({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBeCloseTo(5);
        expect(cubeHalfExtent(2)).toBeCloseTo(Math.sqrt(3));
    });

    it('bounces only when outside/at limit and moving outward', () => {
        // limit = sphereRadius - halfExtent = 8 - 0.5 = 7.5
        const position = { x: 7.6, y: 0, z: 0 };
        const outward = { x: 1, y: 0, z: 0 };
        const inward = { x: -1, y: 0, z: 0 };

        expect(shouldBounceOffSphere(position, outward, 8, 0.5)).toBe(true);
        expect(shouldBounceOffSphere(position, inward, 8, 0.5)).toBe(false);
        expect(shouldBounceOffSphere({ x: 1, y: 0, z: 0 }, outward, 8, 0.5)).toBe(false);
        expect(bounceVelocity(outward)).toEqual({ x: -1, y: 0, z: 0 });
    });

    it('clamps spawn points inside the sphere', () => {
        const inside = clampPointInsideSphere({ x: 1, y: 0, z: 0 }, 8, 1);
        expect(inside).toEqual({ x: 1, y: 0, z: 0 });

        const outside = clampPointInsideSphere({ x: 100, y: 0, z: 0 }, 8, 1, 0.85);
        const maxDistance = (8 - 1) * 0.85;
        expect(outside.x).toBeCloseTo(maxDistance);
        expect(outside.y).toBe(0);
        expect(outside.z).toBe(0);
    });
});
