import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThreeCubeScene } from './ThreeCubeScene.js';

function createCanvasContextStub() {
    return {
        clearRect: vi.fn(),
        fillText: vi.fn(),
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: ''
    };
}

function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 420 });
    document.body.appendChild(canvas);
    return canvas;
}

function createFakeThree() {
    class FakeColor {
        constructor(value) {
            this.value = value;
        }

        getHexString() {
            return 'add8e6';
        }

        set(value) {
            this.value = value;
        }
    }

    class FakeVector3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        copy(vector) {
            this.x = vector.x;
            this.y = vector.y;
            this.z = vector.z;
            return this;
        }
    }

    class FakeVector2 {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }

        set(x, y) {
            this.x = x;
            this.y = y;
            return this;
        }
    }

    class FakeScene {
        constructor() {
            this.children = [];
        }

        add(item) {
            this.children.push(item);
        }

        remove(item) {
            this.children = this.children.filter((existing) => existing !== item);
        }
    }

    class FakePerspectiveCamera {
        constructor(fov, aspect) {
            this.fov = fov;
            this.aspect = aspect;
            this.position = new FakeVector3();
            this.lookAt = vi.fn();
            this.updateProjectionMatrix = vi.fn();
        }
    }

    class FakeWebGLRenderer {
        constructor() {
            this.setPixelRatio = vi.fn();
            this.setSize = vi.fn();
            this.render = vi.fn();
            this.dispose = vi.fn();
        }
    }

    class FakeAmbientLight {
        constructor(color, intensity) {
            this.color = color;
            this.intensity = intensity;
        }
    }

    class FakeDirectionalLight {
        constructor(color, intensity) {
            this.color = color;
            this.intensity = intensity;
            this.position = new FakeVector3();
        }
    }

    class FakeAxesHelper {
        constructor(size) {
            this.size = size;
            this.setColors = vi.fn();
            this.geometry = { dispose: vi.fn() };
            this.material = { dispose: vi.fn() };
        }
    }

    class FakePlane {
        constructor(normal, constant) {
            this.normal = normal;
            this.constant = constant;
        }
    }

    class FakeRaycaster {
        constructor() {
            this.lastPointer = null;
            this.setFromCamera = vi.fn((pointer) => {
                this.lastPointer = pointer;
            });
            this.ray = {
                intersectPlane: vi.fn((plane, target) => {
                    target.set(this.lastPointer?.x ?? 1, this.lastPointer?.y ?? 2, 0);
                    return target;
                })
            };
        }
    }

    class FakeClock {
        getDelta() {
            return 1 / 60;
        }
    }

    class FakeBoxGeometry {
        constructor() {
            this.dispose = vi.fn();
        }
    }

    class FakeMeshStandardMaterial {
        constructor({ color }) {
            this.initialColor = color;
            this.color = { set: vi.fn() };
            this.dispose = vi.fn();
        }
    }

    class FakeMesh {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.position = new FakeVector3();
            this.rotation = { x: 0, y: 0, z: 0 };
            this.scale = { setScalar: vi.fn() };
        }
    }

    class FakeCanvasTexture {
        constructor(image) {
            this.image = image;
            this.needsUpdate = false;
            this.dispose = vi.fn();
        }
    }

    class FakeSpriteMaterial {
        constructor({ map, transparent }) {
            this.map = map;
            this.transparent = transparent;
            this.dispose = vi.fn();
        }
    }

    class FakeSprite {
        constructor(material) {
            this.material = material;
            this.position = new FakeVector3();
            this.scale = new FakeVector3();
            this.userData = {};
        }
    }

    return {
        Color: FakeColor,
        Vector2: FakeVector2,
        Vector3: FakeVector3,
        Scene: FakeScene,
        PerspectiveCamera: FakePerspectiveCamera,
        WebGLRenderer: FakeWebGLRenderer,
        AmbientLight: FakeAmbientLight,
        DirectionalLight: FakeDirectionalLight,
        AxesHelper: FakeAxesHelper,
        Plane: FakePlane,
        Raycaster: FakeRaycaster,
        Clock: FakeClock,
        BoxGeometry: FakeBoxGeometry,
        MeshStandardMaterial: FakeMeshStandardMaterial,
        Mesh: FakeMesh,
        CanvasTexture: FakeCanvasTexture,
        SpriteMaterial: FakeSpriteMaterial,
        Sprite: FakeSprite
    };
}

function createTestHarness() {
    document.body.innerHTML = '';

    const animation = { callback: null };
    const requestAnimationFrameImpl = vi.fn((callback) => {
        animation.callback = callback;
        return 99;
    });
    const cancelAnimationFrameImpl = vi.fn();
    const windowObject = {
        devicePixelRatio: 1.5,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    };

    return {
        canvas: createCanvas(),
        three: createFakeThree(),
        requestAnimationFrameImpl,
        cancelAnimationFrameImpl,
        windowObject,
        animation
    };
}

describe('ThreeCubeScene', () => {
    let getContextSpy;

    beforeEach(() => {
        getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
            .mockImplementation(() => createCanvasContextStub());
    });

    afterEach(() => {
        getContextSpy.mockRestore();
    });

    it('initializes renderer, camera, colored axes, and axis labels', () => {
        const {
            canvas,
            three,
            requestAnimationFrameImpl,
            cancelAnimationFrameImpl,
            windowObject
        } = createTestHarness();

        const scene = new ThreeCubeScene({
            canvas,
            three,
            requestAnimationFrameImpl,
            cancelAnimationFrameImpl,
            windowObject
        });
        scene.initialize();

        expect(scene.isInitialized).toBe(true);
        expect(scene.renderer.setPixelRatio).toHaveBeenCalledWith(1.5);
        expect(scene.renderer.setSize).toHaveBeenCalledWith(640, 420, false);
        expect(scene.axesHelper.setColors).toHaveBeenCalledTimes(1);
        const [xColor, yColor, zColor] = scene.axesHelper.setColors.mock.calls[0];
        expect(xColor.value).toBe('red');
        expect(yColor.value).toBe('green');
        expect(zColor.value).toBe('blue');
        expect(scene.axisLabels.map((axisLabel) => axisLabel.userData.axisLabel)).toEqual(['x', 'y', 'z']);
        expect(scene.axisLabels[0].position.x).toBeGreaterThan(0);
        expect(scene.axisLabels[1].position.y).toBeGreaterThan(0);
        expect(scene.axisLabels[2].position.z).toBeGreaterThan(0);
        expect(windowObject.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(requestAnimationFrameImpl).toHaveBeenCalledTimes(1);
    });

    it('creates cube from pointer interaction and replaces the previous cube on next click', () => {
        const harness = createTestHarness();
        const scene = new ThreeCubeScene(harness).initialize();

        const firstClick = new MouseEvent('click', { clientX: 320, clientY: 210 });
        const secondClick = new MouseEvent('click', { clientX: 440, clientY: 160 });

        expect(scene.createCubeAtPointer(firstClick, { faceColors: Array(6).fill('#123456') })).toBe(true);
        const firstCube = scene.cube;
        expect(scene.createCubeAtPointer(secondClick)).toBe(true);
        expect(scene.cube).not.toBe(firstCube);
        expect(firstCube.geometry.dispose).toHaveBeenCalledTimes(1);
        firstCube.material.forEach((material) => {
            expect(material.dispose).toHaveBeenCalledTimes(1);
        });
    });

    it('applies rotation, scale, and face-color updates and can reset transform state', () => {
        const { animation, ...harness } = createTestHarness();
        const scene = new ThreeCubeScene(harness).initialize();
        scene.createCubeAtPointer(new MouseEvent('click', { clientX: 320, clientY: 210 }));

        scene.setRotationAxis('z');
        scene.setRotationSpeed(0.1);
        const previousRotation = scene.cube.rotation.z;
        animation.callback();
        expect(scene.cube.rotation.z).toBeGreaterThan(previousRotation);

        scene.setCubeScale(2.6);
        expect(scene.cube.scale.setScalar).toHaveBeenCalledWith(2.6);

        scene.setFaceColor(2, '#ff0000');
        expect(scene.cube.material[2].color.set).toHaveBeenCalledWith('#ff0000');

        scene.cube.rotation.x = 1.4;
        scene.cube.rotation.y = 0.4;
        scene.cube.rotation.z = 0.8;
        expect(scene.resetCubeTransform({ scale: 1, rotationAxis: 'x', rotationSpeed: 0.05 })).toBe(true);
        expect(scene.cube.scale.setScalar).toHaveBeenCalledWith(1);
        expect(scene.cube.rotation).toEqual({ x: 0, y: 0, z: 0 });
        expect(scene.rotationAxis).toBe('x');
        expect(scene.rotationSpeed).toBe(0.05);
    });

    it('disposes animation, renderer, listeners, and objects', () => {
        const harness = createTestHarness();
        const scene = new ThreeCubeScene(harness).initialize();
        scene.createCubeAtPointer(new MouseEvent('click', { clientX: 320, clientY: 210 }));

        const renderer = scene.renderer;
        const axesHelper = scene.axesHelper;
        const cube = scene.cube;
        const axisLabels = [...scene.axisLabels];

        scene.dispose();

        expect(harness.cancelAnimationFrameImpl).toHaveBeenCalledWith(99);
        expect(harness.windowObject.removeEventListener).toHaveBeenCalledWith(
            'resize',
            expect.any(Function)
        );
        expect(renderer.dispose).toHaveBeenCalledTimes(1);
        expect(axesHelper.geometry.dispose).toHaveBeenCalledTimes(1);
        expect(axesHelper.material.dispose).toHaveBeenCalledTimes(1);
        expect(cube.geometry.dispose).toHaveBeenCalledTimes(1);
        cube.material.forEach((material) => {
            expect(material.dispose).toHaveBeenCalledTimes(1);
        });
        axisLabels.forEach((axisLabel) => {
            expect(axisLabel.material.map.dispose).toHaveBeenCalledTimes(1);
            expect(axisLabel.material.dispose).toHaveBeenCalledTimes(1);
        });
        expect(scene.isInitialized).toBe(false);
    });
});
