import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CubesExplodingScene } from './CubesExplodingScene.js';
import * as THREE from 'three';

// Mock OrbitControls since it needs a real DOM
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
    OrbitControls: class {
        constructor() {
            this.mouseButtons = {};
        }
        update() {}
        dispose() {}
    }
}));

// Mock WebGLRenderer to avoid WebGL context errors in JSDOM
vi.mock('three', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        WebGLRenderer: class {
            constructor() {
                this.domElement = document.createElement('canvas');
            }
            setSize() {}
            setPixelRatio() {}
            render() {}
            dispose() {}
        }
    };
});

describe('CubesExplodingScene', () => {
    let scene;
    let mockCanvas;

    beforeEach(() => {
        mockCanvas = {
            parentElement: {
                getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0 })
            },
            getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0 }),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        scene = new CubesExplodingScene(mockCanvas);
        scene.initialize();
    });

    it('initializes correctly', () => {
        expect(scene.renderer).toBeDefined();
        expect(scene.scene).toBeDefined();
        expect(scene.camera).toBeDefined();
        expect(scene.controls).toBeDefined();
        expect(scene.sphere).toBeDefined();
    });

    it('updates sphere scale', () => {
        scene.updateSphereScale(15);
        expect(scene.sphere.scale.x).toBe(15);
        expect(scene.sphere.scale.y).toBe(15);
        expect(scene.sphere.scale.z).toBe(15);
    });

    it('spawns a cube inside the sphere limit', () => {
        expect(scene.cubes.length).toBe(0);
        scene.spawnCube(new THREE.Vector3(0, 0, 0));
        expect(scene.cubes.length).toBe(1);
    });

    it('does not spawn cube if maxCubes limit is reached', () => {
        scene.maxCubes = 2;
        scene.spawnCube(new THREE.Vector3(0, 0, 0));
        scene.spawnCube(new THREE.Vector3(1, 0, 0));
        expect(scene.cubes.length).toBe(2);
        
        scene.spawnCube(new THREE.Vector3(2, 0, 0));
        expect(scene.cubes.length).toBe(2); // Still 2
    });

    it('bounces cube off sphere boundary', () => {
        scene.createSphereBoundary(8);
        scene.spawnCube(new THREE.Vector3(0, 0, 0));
        const cube = scene.cubes[0];
        
        // Force position near boundary, moving outwards
        cube.position.set(7.5, 0, 0);
        cube.velocity.set(0.5, 0, 0);
        
        scene.updateCubes();
        
        // After one update, it might cross the boundary (8) and have velocity inverted
        // Wait, distance = Math.sqrt(8^2) = 8. If 8 > 8 - 1 (which is 7), it negates velocity.
        // Actually, distance = 8. > 7, so velocity negates.
        expect(cube.velocity.x).toBeLessThan(0);
    });

    it('detects collisions and removes cubes', () => {
        scene.spawnCube(new THREE.Vector3(0, 0, 0));
        scene.spawnCube(new THREE.Vector3(0.1, 0, 0)); // very close to each other
        
        expect(scene.cubes.length).toBe(2);
        
        scene.checkCollisions();
        
        expect(scene.cubes.length).toBe(0);
        // The logic creates explosion for each removed cube
        expect(scene.explosions.length).toBe(2);
    });
});
