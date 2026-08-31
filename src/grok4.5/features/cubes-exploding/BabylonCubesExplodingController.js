import * as BABYLON from '@babylonjs/core';
import {
    DEFAULT_CAMERA_ROTATION_SPEED,
    DEFAULT_MAX_CUBES,
    DEFAULT_SPHERE_SCALE,
    bounceVelocity,
    clampCameraRotationSpeed,
    clampMaxCubes,
    clampPointInsideSphere,
    collectCollisionIndexes,
    cubeHalfExtent,
    randomCubeScale,
    randomRotationSpeed,
    randomVelocity,
    shouldBounceOffSphere,
    sortIndexesDescending
} from './cubesExplodingMath.js';

const SPHERE_SEGMENTS = 32;

/**
 * Owns Babylon scene lifecycle for the exploding-cubes feature.
 */
export class BabylonCubesExplodingController {
    #resizeHandler;
    #pointerHandler;
    #contextMenuHandler;
    #renderObserver;
    #nextCubeId = 1;

    constructor(canvas, {
        sphereScale = DEFAULT_SPHERE_SCALE,
        maxCubes = DEFAULT_MAX_CUBES,
        cameraRotationSpeed = DEFAULT_CAMERA_ROTATION_SPEED,
        rng = Math.random,
        onCubeCountChange = null
    } = {}) {
        this.canvas = canvas;
        this.sphereScale = sphereScale;
        this.maxCubes = clampMaxCubes(maxCubes);
        this.cameraRotationSpeed = clampCameraRotationSpeed(cameraRotationSpeed);
        this.rng = rng;
        this.onCubeCountChange = onCubeCountChange;

        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.sphere = null;
        this.sphereMaterial = null;
        this.cubes = [];
        this.particleSystems = [];

        this.#resizeHandler = this.#handleResize.bind(this);
        this.#pointerHandler = this.#handlePointerDown.bind(this);
        this.#contextMenuHandler = this.#handleContextMenu.bind(this);
    }

    init() {
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.12, 0.12, 0.16, 1);

        this.camera = new BABYLON.ArcRotateCamera(
            'exploding-camera',
            Math.PI / 4,
            Math.PI / 3,
            this.sphereScale * 3,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        // noPreventDefault=false keeps Babylon from losing pointer capture on drag.
        this.camera.attachControl(this.canvas, false);
        this.#configureCameraInputs();
        this.setCameraRotationSpeed(this.cameraRotationSpeed);
        this.camera.lowerRadiusLimit = 4;
        this.camera.upperRadiusLimit = Math.max(40, this.sphereScale * 6);

        new BABYLON.HemisphericLight(
            'exploding-light',
            new BABYLON.Vector3(0.4, 1, 0.2),
            this.scene
        );

        this.#createSphereBoundary(this.sphereScale);

        this.#renderObserver = this.scene.onBeforeRenderObservable.add(() => {
            this.#updateSimulation();
        });

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', this.#resizeHandler);
        this.canvas.addEventListener('pointerdown', this.#pointerHandler);
        this.canvas.addEventListener('contextmenu', this.#contextMenuHandler);
        this.#emitCubeCount();
    }

    getCubeCount() {
        return this.cubes.length;
    }

    setSphereScale(scale) {
        const numeric = Number(scale);
        if (!Number.isFinite(numeric) || numeric <= 0) {
            return;
        }

        this.sphereScale = numeric;
        if (this.sphere) {
            this.sphere.scaling = new BABYLON.Vector3(numeric, numeric, numeric);
        }
        if (this.camera) {
            this.camera.upperRadiusLimit = Math.max(40, numeric * 6);
        }
    }

    setMaxCubes(value) {
        this.maxCubes = clampMaxCubes(value);
        this.#emitCubeCount();
    }

    /**
     * Master multiplier for orbit rotation speed (Babylon camera.movement.speed).
     * Default 1.0 matches Babylon ArcRotateCamera defaults.
     */
    setCameraRotationSpeed(value) {
        this.cameraRotationSpeed = clampCameraRotationSpeed(value);
        if (this.camera?.movement) {
            this.camera.movement.speed = this.cameraRotationSpeed;
        }
    }

    /**
     * Spawns a cube at a world-space point if under the max limit.
     * @returns {boolean} whether a cube was created
     */
    spawnCubeAt(worldPoint) {
        if (this.cubes.length >= this.maxCubes || !this.scene) {
            return false;
        }

        const scale = randomCubeScale(1, 5, this.rng);
        const halfExtent = cubeHalfExtent(scale);
        const position = clampPointInsideSphere(
            worldPoint,
            this.sphereScale,
            halfExtent
        );

        const mesh = BABYLON.MeshBuilder.CreateBox(
            `exploding-cube-${this.#nextCubeId}`,
            { size: 1 },
            this.scene
        );
        mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
        mesh.position = new BABYLON.Vector3(position.x, position.y, position.z);

        const material = new BABYLON.StandardMaterial(
            `exploding-cube-mat-${this.#nextCubeId}`,
            this.scene
        );
        material.diffuseColor = new BABYLON.Color3(
            0.3 + this.rng() * 0.7,
            0.3 + this.rng() * 0.7,
            0.3 + this.rng() * 0.7
        );
        mesh.material = material;

        const record = {
            id: this.#nextCubeId,
            mesh,
            material,
            scale,
            halfExtent,
            velocity: randomVelocity(this.rng),
            rotationSpeed: randomRotationSpeed(this.rng)
        };
        this.#nextCubeId += 1;
        this.cubes.push(record);
        this.#emitCubeCount();
        return true;
    }

    /**
     * Screen-space pick against the sphere; spawn when hit.
     * @returns {boolean}
     */
    trySpawnCubeAtScreen(clientX, clientY) {
        if (!this.scene || !this.sphere) {
            return false;
        }

        const pick = this.scene.pick(
            this.scene.pointerX ?? clientX,
            this.scene.pointerY ?? clientY,
            (mesh) => mesh === this.sphere
        );

        // Fallback: use canvas-relative coordinates when pointerX/Y unavailable in tests
        let effectivePick = pick;
        if ((!effectivePick || !effectivePick.hit) && typeof clientX === 'number') {
            const rect = this.canvas.getBoundingClientRect?.() ?? { left: 0, top: 0 };
            effectivePick = this.scene.pick(
                clientX - rect.left,
                clientY - rect.top,
                (mesh) => mesh === this.sphere
            );
        }

        if (!effectivePick?.hit || !effectivePick.pickedPoint) {
            return false;
        }

        const point = effectivePick.pickedPoint;
        return this.spawnCubeAt({ x: point.x, y: point.y, z: point.z });
    }

    /**
     * Test/helper entry for running one simulation step without the render loop.
     */
    stepSimulation() {
        this.#updateSimulation();
    }

    dispose() {
        window.removeEventListener('resize', this.#resizeHandler);
        this.canvas?.removeEventListener('pointerdown', this.#pointerHandler);
        this.canvas?.removeEventListener('contextmenu', this.#contextMenuHandler);

        if (this.scene && this.#renderObserver) {
            this.scene.onBeforeRenderObservable.remove(this.#renderObserver);
        }
        this.#renderObserver = null;

        for (const system of this.particleSystems) {
            system.dispose?.();
        }
        this.particleSystems = [];

        for (const cube of this.cubes) {
            cube.material?.dispose?.();
            cube.mesh?.dispose?.();
        }
        this.cubes = [];

        this.sphereMaterial?.dispose?.();
        this.sphere?.dispose?.();
        this.sphere = null;
        this.sphereMaterial = null;

        this.engine?.dispose();
        this.engine = null;
        this.scene = null;
        this.camera = null;
    }

    #configureCameraInputs() {
        // Babylon.js v9 ArcRotateCamera defaults (Camera Movement and Input System):
        //   LMB (button 0) -> rotate, RMB (button 2) -> pan
        // We need RMB orbit around the sphere, and LMB free for cube spawning.
        const pointers = this.camera?.inputs?.attached?.pointers;
        if (pointers && 'buttons' in pointers) {
            // Only accept right mouse button in the pointer input plugin.
            pointers.buttons = [2];
        }

        const input = this.camera?.movement?.input;
        if (input && typeof input.setInteraction === 'function') {
            // Rebind right-drag from pan -> rotate (official inputMap API).
            input.setInteraction('pointer', { button: 2 }, 'rotate');
            // Ensure plain left-drag does not orbit if pointers.buttons is ignored.
            input.setInteraction('pointer', { button: 0 }, 'pan');
        }

        // Disable panning feel if any pan gesture remains active.
        if (this.camera && 'panningSensibility' in this.camera) {
            this.camera.panningSensibility = 0;
        }
    }

    #handleContextMenu(event) {
        // Keep the browser context menu from interrupting right-drag orbit.
        event.preventDefault();
    }

    #createSphereBoundary(scale) {
        this.sphere = BABYLON.MeshBuilder.CreateSphere(
            'boundary-sphere',
            {
                diameter: 2,
                segments: SPHERE_SEGMENTS
            },
            this.scene
        );
        this.sphere.scaling = new BABYLON.Vector3(scale, scale, scale);

        this.sphereMaterial = new BABYLON.StandardMaterial('boundary-sphere-mat', this.scene);
        this.sphereMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.65, 1);
        this.sphereMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.2, 0.35);
        this.sphereMaterial.alpha = 0.15;
        this.sphereMaterial.wireframe = true;
        this.sphereMaterial.backFaceCulling = false;
        this.sphere.material = this.sphereMaterial;
        this.sphere.isPickable = true;
    }

    #handlePointerDown(event) {
        if (event.button !== 0) {
            return;
        }
        this.trySpawnCubeAtScreen(event.clientX, event.clientY);
    }

    #handleResize() {
        this.engine?.resize();
    }

    #emitCubeCount() {
        if (typeof this.onCubeCountChange === 'function') {
            this.onCubeCountChange(this.cubes.length, this.maxCubes);
        }
    }

    #updateSimulation() {
        if (!this.cubes.length) {
            return;
        }

        const sphereRadius = this.sphereScale;

        for (const cube of this.cubes) {
            const { mesh, velocity, rotationSpeed, halfExtent } = cube;
            mesh.rotation.x += rotationSpeed.x;
            mesh.rotation.y += rotationSpeed.y;
            mesh.rotation.z += rotationSpeed.z;

            mesh.position.x += velocity.x;
            mesh.position.y += velocity.y;
            mesh.position.z += velocity.z;

            const position = {
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z
            };

            if (shouldBounceOffSphere(position, velocity, sphereRadius, halfExtent)) {
                const bounced = bounceVelocity(velocity);
                cube.velocity.x = bounced.x;
                cube.velocity.y = bounced.y;
                cube.velocity.z = bounced.z;
            }
        }

        this.#resolveCollisions();
    }

    #resolveCollisions() {
        const snapshots = this.cubes.map((cube) => ({
            x: cube.mesh.position.x,
            y: cube.mesh.position.y,
            z: cube.mesh.position.z,
            halfExtent: cube.halfExtent
        }));

        const indexes = sortIndexesDescending(collectCollisionIndexes(snapshots));
        if (!indexes.length) {
            return;
        }

        for (const index of indexes) {
            const cube = this.cubes[index];
            if (!cube) {
                continue;
            }
            this.#spawnExplosion(cube.mesh.position);
            cube.material?.dispose?.();
            cube.mesh?.dispose?.();
            this.cubes.splice(index, 1);
        }

        this.#emitCubeCount();
    }

    #spawnExplosion(position) {
        if (!this.scene) {
            return;
        }

        // Lightweight burst: short-lived particle system when available; no-op safe dispose otherwise.
        if (typeof BABYLON.ParticleSystem !== 'function') {
            return;
        }

        const system = new BABYLON.ParticleSystem(
            `explosion-${this.#nextCubeId}`,
            80,
            this.scene
        );
        system.emitter = new BABYLON.Vector3(position.x, position.y, position.z);
        system.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        system.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
        system.color1 = new BABYLON.Color4(1, 0.6, 0.1, 1);
        system.color2 = new BABYLON.Color4(1, 0.2, 0.05, 1);
        system.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0);
        system.minSize = 0.15;
        system.maxSize = 0.45;
        system.minLifeTime = 0.15;
        system.maxLifeTime = 0.45;
        system.emitRate = 400;
        system.direction1 = new BABYLON.Vector3(-1, -1, -1);
        system.direction2 = new BABYLON.Vector3(1, 1, 1);
        system.minEmitPower = 2;
        system.maxEmitPower = 6;
        system.updateSpeed = 0.02;
        system.targetStopDuration = 0.25;
        system.disposeOnStop = true;
        system.start();

        this.particleSystems.push(system);
        system.onDisposeObservable?.add?.(() => {
            this.particleSystems = this.particleSystems.filter((item) => item !== system);
        });
    }
}

export function createBabylonCubesExplodingController(canvas, options) {
    const controller = new BabylonCubesExplodingController(canvas, options);
    controller.init();
    return controller;
}

export {
    DEFAULT_CAMERA_ROTATION_SPEED,
    DEFAULT_MAX_CUBES,
    DEFAULT_SPHERE_SCALE
};
