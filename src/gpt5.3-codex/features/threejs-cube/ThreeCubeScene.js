import * as THREE from 'three';
import { DEFAULT_FACE_COLOR, DEFAULT_ROTATION_AXIS, DEFAULT_ROTATION_SPEED } from './CubeState.js';

const DEFAULT_CANVAS_WIDTH = 640;
const DEFAULT_CANVAS_HEIGHT = 420;
const AXIS_HELPER_SIZE = 4;
const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;

export class ThreeCubeScene {
    constructor({
        canvas,
        three = THREE,
        windowObject = window,
        requestAnimationFrameImpl,
        cancelAnimationFrameImpl
    } = {}) {
        if (!canvas) {
            throw new Error('ThreeCubeScene requires a canvas element');
        }

        this.canvas = canvas;
        this.three = three;
        this.windowObject = windowObject;
        this.requestAnimationFrameImpl = requestAnimationFrameImpl
            ?? this.windowObject.requestAnimationFrame?.bind(this.windowObject);
        this.cancelAnimationFrameImpl = cancelAnimationFrameImpl
            ?? this.windowObject.cancelAnimationFrame?.bind(this.windowObject);
        if (
            typeof this.requestAnimationFrameImpl !== 'function'
            || typeof this.cancelAnimationFrameImpl !== 'function'
        ) {
            throw new Error('ThreeCubeScene requires requestAnimationFrame/cancelAnimationFrame');
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.axesHelper = null;
        this.raycaster = null;
        this.pointer = null;
        this.interactionPlane = null;
        this.clock = null;
        this.cube = null;
        this.animationFrameId = null;
        this.rotationAxis = DEFAULT_ROTATION_AXIS;
        this.rotationSpeed = DEFAULT_ROTATION_SPEED;
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) {
            return this;
        }

        const { width, height } = this.#resolveCanvasSize();
        const { Scene, PerspectiveCamera, WebGLRenderer, Color } = this.three;

        this.scene = new Scene();
        this.scene.background = new Color('#f4f4f4');

        this.camera = new PerspectiveCamera(CAMERA_FOV, width / height, CAMERA_NEAR, CAMERA_FAR);
        this.camera.position.set(3, 3, 5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setPixelRatio(Math.min(this.windowObject.devicePixelRatio ?? 1, 2));
        this.renderer.setSize(width, height, false);

        this.#addLighting();
        this.#addAxesHelper();

        this.raycaster = new this.three.Raycaster();
        this.pointer = new this.three.Vector2();
        this.interactionPlane = new this.three.Plane(new this.three.Vector3(0, 0, 1), 0);
        this.clock = new this.three.Clock();

        this.windowObject.addEventListener('resize', this.#handleResize);

        this.isInitialized = true;
        this.#animate();
        return this;
    }

    createCubeAtPointer(event, { faceColors } = {}) {
        if (this.cube || !this.isInitialized) {
            return false;
        }

        const position = this.#resolvePointerIntersection(event);
        if (!position) {
            return false;
        }

        const geometry = new this.three.BoxGeometry(1, 1, 1);
        const cubeFaceColors = Array.isArray(faceColors) && faceColors.length === 6
            ? faceColors
            : Array.from({ length: 6 }, () => DEFAULT_FACE_COLOR);
        const materials = cubeFaceColors.map((color) => new this.three.MeshStandardMaterial({ color }));

        this.cube = new this.three.Mesh(geometry, materials);
        this.cube.position.copy(position);
        this.scene.add(this.cube);
        return true;
    }

    setCubeScale(scale) {
        if (!this.cube) {
            return false;
        }

        this.cube.scale.setScalar(scale);
        return true;
    }

    setRotationAxis(rotationAxis) {
        this.rotationAxis = rotationAxis;
        return true;
    }

    setRotationSpeed(rotationSpeed) {
        this.rotationSpeed = rotationSpeed;
        return true;
    }

    setFaceColor(faceIndex, color) {
        if (!this.cube || !Array.isArray(this.cube.material)) {
            return false;
        }

        const material = this.cube.material[faceIndex];
        if (!material) {
            return false;
        }

        material.color.set(color);
        return true;
    }

    dispose() {
        if (!this.isInitialized) {
            return;
        }

        this.windowObject.removeEventListener('resize', this.#handleResize);

        if (this.animationFrameId !== null) {
            this.cancelAnimationFrameImpl(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.cube) {
            this.scene.remove(this.cube);
            disposeObject3D(this.cube);
            this.cube = null;
        }

        if (this.axesHelper) {
            this.scene.remove(this.axesHelper);
            disposeObject3D(this.axesHelper);
            this.axesHelper = null;
        }

        this.renderer.dispose();
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.raycaster = null;
        this.pointer = null;
        this.interactionPlane = null;
        this.clock = null;
        this.isInitialized = false;
    }

    #animate = () => {
        if (!this.canvas.isConnected) {
            this.dispose();
            return;
        }

        if (this.cube) {
            const delta = this.clock.getDelta();
            const rotationStep = this.rotationSpeed * delta * 60;
            this.cube.rotation[this.rotationAxis] += rotationStep;
        }

        this.renderer.render(this.scene, this.camera);
        this.animationFrameId = this.requestAnimationFrameImpl(this.#animate);
    };

    #handleResize = () => {
        if (!this.renderer || !this.camera) {
            return;
        }

        const { width, height } = this.#resolveCanvasSize();
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    };

    #addLighting() {
        const ambientLight = new this.three.AmbientLight(0xffffff, 0.65);
        const directionalLight = new this.three.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(4, 6, 5);

        this.scene.add(ambientLight);
        this.scene.add(directionalLight);
    }

    #addAxesHelper() {
        this.axesHelper = new this.three.AxesHelper(AXIS_HELPER_SIZE);
        if (typeof this.axesHelper.setColors === 'function') {
            this.axesHelper.setColors(
                new this.three.Color('red'),
                new this.three.Color('green'),
                new this.three.Color('blue')
            );
        }

        this.scene.add(this.axesHelper);
    }

    #resolveCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        return {
            width: Math.max(
                1,
                Math.floor(rect.width || this.canvas.clientWidth || this.canvas.width || DEFAULT_CANVAS_WIDTH)
            ),
            height: Math.max(
                1,
                Math.floor(
                    rect.height || this.canvas.clientHeight || this.canvas.height || DEFAULT_CANVAS_HEIGHT
                )
            )
        };
    }

    #resolvePointerIntersection(event) {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width || this.canvas.width || DEFAULT_CANVAS_WIDTH;
        const height = rect.height || this.canvas.height || DEFAULT_CANVAS_HEIGHT;
        if (width <= 0 || height <= 0) {
            return null;
        }

        const pointerX = ((event.clientX - rect.left) / width) * 2 - 1;
        const pointerY = -((event.clientY - rect.top) / height) * 2 + 1;

        this.pointer.set(pointerX, pointerY);
        this.raycaster.setFromCamera(this.pointer, this.camera);

        const intersectionPoint = new this.three.Vector3();
        const hasIntersection = this.raycaster.ray.intersectPlane(
            this.interactionPlane,
            intersectionPoint
        );

        return hasIntersection ? intersectionPoint : null;
    }
}

function disposeObject3D(object3D) {
    object3D.geometry?.dispose?.();
    if (Array.isArray(object3D.material)) {
        object3D.material.forEach((material) => material?.dispose?.());
        return;
    }

    object3D.material?.dispose?.();
}
