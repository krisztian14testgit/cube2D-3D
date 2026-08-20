import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    engineDisposeSpy,
    engineResizeSpy,
    runRenderLoopSpy,
    createSphereSpy,
    createBoxSpy,
    attachControlSpy,
    addObservableSpy,
    removeObservableSpy,
    pickSpy,
    particleStartSpy,
    particleDisposeSpy
} = vi.hoisted(() => ({
    engineDisposeSpy: vi.fn(),
    engineResizeSpy: vi.fn(),
    runRenderLoopSpy: vi.fn((cb) => {
        runRenderLoopSpy.callback = cb;
    }),
    createSphereSpy: vi.fn(() => ({
        scaling: null,
        material: null,
        isPickable: false,
        dispose: vi.fn()
    })),
    createBoxSpy: vi.fn(() => ({
        scaling: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: null,
        dispose: vi.fn()
    })),
    attachControlSpy: vi.fn(),
    addObservableSpy: vi.fn((cb) => {
        addObservableSpy.callback = cb;
        return { callback: cb };
    }),
    removeObservableSpy: vi.fn(),
    pickSpy: vi.fn(() => ({
        hit: true,
        pickedPoint: { x: 1, y: 0, z: 0 }
    })),
    particleStartSpy: vi.fn(),
    particleDisposeSpy: vi.fn()
}));

vi.mock('@babylonjs/core', () => {
    class Vector3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        static Zero() {
            return new Vector3(0, 0, 0);
        }
    }

    class Color3 {
        constructor(r, g, b) {
            this.r = r;
            this.g = g;
            this.b = b;
        }
    }

    class Color4 {
        constructor(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
    }

    class Engine {
        constructor() {
            this.dispose = engineDisposeSpy;
            this.resize = engineResizeSpy;
            this.runRenderLoop = runRenderLoopSpy;
        }
    }

    class Scene {
        constructor() {
            this.clearColor = null;
            this.pointerX = 10;
            this.pointerY = 20;
            this.render = vi.fn();
            this.pick = pickSpy;
            this.onBeforeRenderObservable = {
                add: addObservableSpy,
                remove: removeObservableSpy
            };
        }
    }

    class ArcRotateCamera {
        constructor() {
            this.attachControl = attachControlSpy;
            this.lowerRadiusLimit = 0;
            this.upperRadiusLimit = 0;
            this.inputs = {
                attached: {
                    pointers: {
                        buttons: [0, 1, 2]
                    }
                }
            };
        }
    }

    class HemisphericLight {}

    class StandardMaterial {
        constructor() {
            this.diffuseColor = null;
            this.emissiveColor = null;
            this.alpha = 1;
            this.wireframe = false;
            this.backFaceCulling = true;
            this.dispose = vi.fn();
        }
    }

    class ParticleSystem {
        constructor() {
            this.emitter = null;
            this.minEmitBox = null;
            this.maxEmitBox = null;
            this.color1 = null;
            this.color2 = null;
            this.colorDead = null;
            this.minSize = 0;
            this.maxSize = 0;
            this.minLifeTime = 0;
            this.maxLifeTime = 0;
            this.emitRate = 0;
            this.direction1 = null;
            this.direction2 = null;
            this.minEmitPower = 0;
            this.maxEmitPower = 0;
            this.updateSpeed = 0;
            this.targetStopDuration = 0;
            this.disposeOnStop = false;
            this.start = particleStartSpy;
            this.dispose = particleDisposeSpy;
            this.onDisposeObservable = { add: vi.fn() };
        }
    }

    const MeshBuilder = {
        CreateSphere: (...args) => createSphereSpy(...args),
        CreateBox: (...args) => createBoxSpy(...args)
    };

    return {
        Vector3,
        Color3,
        Color4,
        Engine,
        Scene,
        ArcRotateCamera,
        HemisphericLight,
        StandardMaterial,
        ParticleSystem,
        MeshBuilder
    };
});

import {
    BabylonCubesExplodingController,
    DEFAULT_MAX_CUBES,
    DEFAULT_SPHERE_SCALE,
    createBabylonCubesExplodingController
} from './BabylonCubesExplodingController.js';

describe('BabylonCubesExplodingController', () => {
    let canvas;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 513, height: 513 });

        engineDisposeSpy.mockClear();
        engineResizeSpy.mockClear();
        runRenderLoopSpy.mockClear();
        createSphereSpy.mockClear();
        createBoxSpy.mockClear();
        attachControlSpy.mockClear();
        addObservableSpy.mockClear();
        removeObservableSpy.mockClear();
        pickSpy.mockClear();
        particleStartSpy.mockClear();
        particleDisposeSpy.mockClear();
        addObservableSpy.callback = undefined;
        runRenderLoopSpy.callback = undefined;

        pickSpy.mockReturnValue({
            hit: true,
            pickedPoint: { x: 1, y: 0, z: 0 }
        });

        let call = 0;
        createBoxSpy.mockImplementation(() => {
            call += 1;
            return {
                scaling: null,
                position: { x: call * 0.01, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                material: null,
                dispose: vi.fn()
            };
        });
    });

    it('uses default sphere scale and max cubes', () => {
        const controller = new BabylonCubesExplodingController(canvas);
        expect(controller.sphereScale).toBe(DEFAULT_SPHERE_SCALE);
        expect(controller.maxCubes).toBe(DEFAULT_MAX_CUBES);
    });

    it('initializes scene, sphere boundary, camera controls, and render loop', () => {
        const controller = createBabylonCubesExplodingController(canvas);

        expect(createSphereSpy).toHaveBeenCalledTimes(1);
        expect(attachControlSpy).toHaveBeenCalledWith(canvas, true);
        expect(controller.camera.inputs.attached.pointers.buttons).toEqual([2]);
        expect(runRenderLoopSpy).toHaveBeenCalledTimes(1);
        expect(typeof addObservableSpy.callback).toBe('function');
        expect(controller.sphere.material.wireframe).toBe(true);
        expect(controller.sphere.scaling).toEqual({
            x: DEFAULT_SPHERE_SCALE,
            y: DEFAULT_SPHERE_SCALE,
            z: DEFAULT_SPHERE_SCALE
        });

        controller.dispose();
    });

    it('spawns cubes via pick and enforces max cube limit', () => {
        const onCubeCountChange = vi.fn();
        const controller = createBabylonCubesExplodingController(canvas, {
            maxCubes: 10,
            rng: () => 0.5,
            onCubeCountChange
        });

        expect(controller.trySpawnCubeAtScreen(10, 20)).toBe(true);
        expect(createBoxSpy).toHaveBeenCalledTimes(1);
        expect(controller.getCubeCount()).toBe(1);
        expect(onCubeCountChange).toHaveBeenCalledWith(1, 10);

        controller.setMaxCubes(10);
        for (let i = 0; i < 12; i += 1) {
            controller.spawnCubeAt({ x: i * 0.2, y: 0, z: 0 });
        }
        expect(controller.getCubeCount()).toBe(10);

        pickSpy.mockReturnValueOnce({ hit: false });
        expect(controller.trySpawnCubeAtScreen(1, 1)).toBe(false);

        controller.dispose();
    });

    it('updates sphere scale and clamps max cubes', () => {
        const controller = createBabylonCubesExplodingController(canvas);
        controller.setSphereScale(12);
        expect(controller.sphereScale).toBe(12);
        expect(controller.sphere.scaling).toEqual({ x: 12, y: 12, z: 12 });

        controller.setMaxCubes(3);
        expect(controller.maxCubes).toBe(10);
        controller.setMaxCubes(40);
        expect(controller.maxCubes).toBe(40);

        controller.dispose();
    });

    it('bounces cubes at the sphere boundary', () => {
        const controller = createBabylonCubesExplodingController(canvas, {
            sphereScale: 8,
            rng: () => 0.5
        });
        controller.spawnCubeAt({ x: 0, y: 0, z: 0 });
        const cube = controller.cubes[0];
        cube.mesh.position = { x: 7.5, y: 0, z: 0 };
        cube.velocity = { x: 0.5, y: 0, z: 0 };
        cube.halfExtent = 0.5;

        controller.stepSimulation();
        expect(cube.velocity.x).toBeLessThan(0);

        controller.dispose();
    });

    it('removes colliding cubes and starts explosion particles', () => {
        const controller = createBabylonCubesExplodingController(canvas, {
            rng: () => 0.5
        });
        controller.spawnCubeAt({ x: 0, y: 0, z: 0 });
        controller.spawnCubeAt({ x: 0.1, y: 0, z: 0 });

        // Force overlapping positions and large extents
        controller.cubes[0].mesh.position = { x: 0, y: 0, z: 0 };
        controller.cubes[1].mesh.position = { x: 0.1, y: 0, z: 0 };
        controller.cubes[0].halfExtent = 2;
        controller.cubes[1].halfExtent = 2;
        controller.cubes[0].velocity = { x: 0, y: 0, z: 0 };
        controller.cubes[1].velocity = { x: 0, y: 0, z: 0 };
        controller.cubes[0].rotationSpeed = { x: 0, y: 0, z: 0 };
        controller.cubes[1].rotationSpeed = { x: 0, y: 0, z: 0 };

        expect(controller.getCubeCount()).toBe(2);
        controller.stepSimulation();
        expect(controller.getCubeCount()).toBe(0);
        expect(particleStartSpy).toHaveBeenCalled();

        controller.dispose();
    });

    it('disposes engine and removes listeners', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const controller = createBabylonCubesExplodingController(canvas);

        expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        controller.dispose();
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(engineDisposeSpy).toHaveBeenCalledTimes(1);
        expect(removeObservableSpy).toHaveBeenCalled();
    });
});
