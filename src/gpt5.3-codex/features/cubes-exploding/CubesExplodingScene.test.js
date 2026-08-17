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

import { CubesExplodingScene } from './CubesExplodingScene.js';

describe('CubesExplodingScene', () => {
    it('constructs without private callback assignment errors', () => {
        const canvas = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        expect(() => new CubesExplodingScene(canvas)).not.toThrow();
    });
});
