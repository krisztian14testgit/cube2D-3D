import { describe, expect, it, vi } from 'vitest';

vi.mock('@babylonjs/core', () => {
    class Dummy {}

    return {
        ArcRotateCamera: Dummy,
        Color3: Dummy,
        Color4: Dummy,
        Engine: Dummy,
        HemisphericLight: Dummy,
        MeshBuilder: {},
        ParticleSystem: Dummy,
        PointerEventTypes: { POINTERDOWN: 0 },
        Scene: Dummy,
        StandardMaterial: Dummy,
        Texture: Dummy,
        Vector3: Dummy
    };
});

import { CUBES_EXPLODING_DEFAULTS, CubesExplodingScene } from './CubesExplodingScene.js';

describe('CubesExplodingScene (Grok4.5)', () => {
    it('constructs without private callback assignment errors', () => {
        const canvas = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        expect(() => new CubesExplodingScene(canvas)).not.toThrow();
    });

    it('exposes default sphere scale as 8', () => {
        expect(CUBES_EXPLODING_DEFAULTS.sphereScale).toBe(8);
        expect(CUBES_EXPLODING_DEFAULTS.maxCubes).toBe(10);
        expect(CUBES_EXPLODING_DEFAULTS.minMaxCubes).toBe(10);
        expect(CUBES_EXPLODING_DEFAULTS.maxMaxCubes).toBe(100);
    });
});
