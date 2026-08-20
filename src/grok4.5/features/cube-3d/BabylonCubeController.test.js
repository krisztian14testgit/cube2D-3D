import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    engineDisposeSpy,
    engineResizeSpy,
    getDeltaTimeSpy,
    runRenderLoopSpy,
    createLinesSpy,
    createBoxSpy,
    fromHexStringSpy,
    attachControlSpy,
    addObservableSpy
} = vi.hoisted(() => ({
    engineDisposeSpy: vi.fn(),
    engineResizeSpy: vi.fn(),
    getDeltaTimeSpy: vi.fn(() => 16),
    runRenderLoopSpy: vi.fn((cb) => {
        runRenderLoopSpy.callback = cb;
    }),
    createLinesSpy: vi.fn(() => ({ color: null })),
    createBoxSpy: vi.fn(() => ({
        position: null,
        scaling: null,
        rotation: { x: 0, y: 0, z: 0 },
        material: null
    })),
    fromHexStringSpy: vi.fn((hex) => ({ hex })),
    attachControlSpy: vi.fn(),
    addObservableSpy: vi.fn((cb) => {
        addObservableSpy.callback = cb;
    })
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

        static FromHexString(hex) {
            return fromHexStringSpy(hex);
        }
    }

    class Engine {
        constructor() {
            this.dispose = engineDisposeSpy;
            this.resize = engineResizeSpy;
            this.getDeltaTime = getDeltaTimeSpy;
            this.runRenderLoop = runRenderLoopSpy;
        }
    }

    class Scene {
        constructor() {
            this.render = vi.fn();
            this.onBeforeRenderObservable = {
                add: addObservableSpy
            };
        }
    }

    class ArcRotateCamera {
        constructor() {
            this.attachControl = attachControlSpy;
        }
    }

    class HemisphericLight {}

    class StandardMaterial {
        constructor() {
            this.diffuseColor = null;
        }
    }

    const MeshBuilder = {
        CreateLines: (...args) => createLinesSpy(...args),
        CreateBox: (...args) => createBoxSpy(...args)
    };

    return {
        Vector3,
        Color3,
        Engine,
        Scene,
        ArcRotateCamera,
        HemisphericLight,
        StandardMaterial,
        MeshBuilder
    };
});

import {
    BabylonCubeController,
    DEFAULT_CUBE_COLOR,
    DEFAULT_ROTATION_AXIS,
    DEFAULT_ROTATION_SPEED,
    createBabylonCubeController
} from './BabylonCubeController.js';

describe('BabylonCubeController', () => {
    let canvas;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        engineDisposeSpy.mockClear();
        engineResizeSpy.mockClear();
        getDeltaTimeSpy.mockClear();
        runRenderLoopSpy.mockClear();
        createLinesSpy.mockClear();
        createBoxSpy.mockClear();
        fromHexStringSpy.mockClear();
        attachControlSpy.mockClear();
        addObservableSpy.mockClear();
        addObservableSpy.callback = undefined;
        runRenderLoopSpy.callback = undefined;
    });

    it('uses default transform options', () => {
        const controller = new BabylonCubeController(canvas);

        expect(controller.rotationAxis).toBe(DEFAULT_ROTATION_AXIS);
        expect(controller.rotationSpeed).toBe(DEFAULT_ROTATION_SPEED);
        expect(controller.cubeColor).toBe(DEFAULT_CUBE_COLOR);
    });

    it('draws RGB axes and starts the render loop on init', () => {
        const controller = createBabylonCubeController(canvas);

        expect(createLinesSpy).toHaveBeenCalledTimes(3);
        expect(attachControlSpy).toHaveBeenCalledWith(canvas, true);
        expect(runRenderLoopSpy).toHaveBeenCalledTimes(1);
        expect(typeof addObservableSpy.callback).toBe('function');

        controller.dispose();
    });

    it('creates one cube and ignores transform APIs before creation', () => {
        const controller = createBabylonCubeController(canvas);

        controller.setCubeScale(2);
        expect(createBoxSpy).not.toHaveBeenCalled();

        expect(controller.createCubeIfMissing()).toBe(true);
        expect(createBoxSpy).toHaveBeenCalledTimes(1);
        expect(fromHexStringSpy).toHaveBeenCalledWith(DEFAULT_CUBE_COLOR);
        expect(controller.createCubeIfMissing()).toBe(false);

        controller.setCubeScale(1.5);
        expect(controller.cube.scaling).toEqual({ x: 1.5, y: 1.5, z: 1.5 });

        controller.setRotationAxis('x');
        controller.setRotationSpeed(3);
        controller.setCubeColor('#ff0000');
        expect(controller.rotationAxis).toBe('x');
        expect(controller.rotationSpeed).toBe(3);
        expect(controller.cubeColor).toBe('#ff0000');
        expect(fromHexStringSpy).toHaveBeenLastCalledWith('#ff0000');

        controller.dispose();
    });

    it('rotates the cube around the selected axis in the render observer', () => {
        const controller = createBabylonCubeController(canvas, {
            rotationAxis: 'z',
            rotationSpeed: 2
        });
        controller.createCubeIfMissing();

        addObservableSpy.callback();

        expect(controller.cube.rotation.z).toBeCloseTo(0.032);
        expect(controller.cube.rotation.x).toBe(0);
        expect(controller.cube.rotation.y).toBe(0);

        controller.dispose();
    });

    it('disposes engine and removes resize listener', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const controller = createBabylonCubeController(canvas);

        expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

        controller.dispose();

        expect(engineDisposeSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(controller.engine).toBeNull();

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });
});
