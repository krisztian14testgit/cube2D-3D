import {
    ArcRotateCamera,
    Color3,
    Color4,
    Engine,
    HemisphericLight,
    MeshBuilder,
    ParticleSystem,
    PointerEventTypes,
    Scene,
    StandardMaterial,
    Texture,
    Vector3
} from '@babylonjs/core';
import {
    clampMaxCubeCount,
    collectCollisionIndexes,
    createRandomCubeState,
    CUBES_EXPLODING_CONSTANTS,
    shouldBounceFromBoundary
} from './CubesExplodingPhysics.js';

const DEFAULT_SPHERE_SCALE = 8;
const DEFAULT_MAX_CUBES = 10;
const BASE_SPHERE_RADIUS = 1;
const EXPLOSION_TEXTURE_BASE64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wzxub8AAAAASUVORK5CYII=';

function toVector3(values) {
    return new Vector3(values.x, values.y, values.z);
}

export class CubesExplodingScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.surfaceSphere = null;
        this.borderSphere = null;
        this.boundaryRadius = DEFAULT_SPHERE_SCALE;
        this.maxCubes = DEFAULT_MAX_CUBES;
        this.cubes = [];
        this.nextCubeId = 0;

        this.#handlePointerDown = this.#handlePointerDown.bind(this);
        this.#handleResize = this.#handleResize.bind(this);
    }

    initialize() {
        if (!this.canvas) {
            return;
        }

        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.12, 0.12, 0.12, 1);

        this.camera = new ArcRotateCamera('camera', 0, 1.2, 30, Vector3.Zero(), this.scene);
        this.camera.lowerRadiusLimit = 8;
        this.camera.upperRadiusLimit = 120;
        this.camera.wheelPrecision = 20;
        this.camera.attachControl(this.canvas, true);
        if (this.camera.inputs?.attached?.pointers) {
            this.camera.inputs.attached.pointers.buttons = [2];
        }

        this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());

        new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);

        this.#createSphereBoundary(DEFAULT_SPHERE_SCALE);

        this.scene.onPointerObservable.add(this.#handlePointerDown, PointerEventTypes.POINTERDOWN);
        this.scene.onBeforeRenderObservable.add(() => {
            this.#updateCubes();
            this.#explodeCollidingCubes();
        });

        window.addEventListener('resize', this.#handleResize);

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    bindControls(container) {
        const scaleSlider = container.querySelector('#gpt-cubes-sphere-scale');
        const scaleValue = container.querySelector('#gpt-cubes-sphere-scale-val');
        const maxCubesInput = container.querySelector('#gpt-cubes-max-cubes');

        scaleSlider?.addEventListener('input', (event) => {
            const scale = Number(event.target.value);
            this.setSphereScale(scale);
            if (scaleValue) {
                scaleValue.textContent = String(scale);
            }
        });

        maxCubesInput?.addEventListener('change', (event) => {
            const nextValue = clampMaxCubeCount(Number(event.target.value));
            event.target.value = String(nextValue);
            this.maxCubes = nextValue;
        });
    }

    setSphereScale(scale) {
        this.boundaryRadius = scale;
        if (this.surfaceSphere) {
            this.surfaceSphere.scaling.setAll(scale);
        }
        if (this.borderSphere) {
            this.borderSphere.scaling.setAll(scale);
        }
    }

    spawnCube(spawnPoint) {
        if (!this.scene || this.cubes.length >= this.maxCubes) {
            return;
        }

        const state = createRandomCubeState(spawnPoint, Math.random);
        const cube = MeshBuilder.CreateBox(
            `cube-${this.nextCubeId}`,
            { size: state.scale },
            this.scene
        );

        const cubeMaterial = new StandardMaterial(`cube-material-${this.nextCubeId}`, this.scene);
        cubeMaterial.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
        cube.material = cubeMaterial;

        cube.position = state.spawnPoint.clone().scaleInPlace(0.9);

        cube.metadata = {
            id: this.nextCubeId,
            velocity: toVector3(state.velocity),
            rotationVelocity: toVector3(state.rotationVelocity),
            collisionRadius: (Math.sqrt(3) / 2) * state.scale
        };

        this.nextCubeId += 1;
        this.cubes.push(cube);
    }

    dispose() {
        if (this.scene) {
            this.scene.onPointerObservable.removeCallback(this.#handlePointerDown);
            this.scene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }

        window.removeEventListener('resize', this.#handleResize);
    }

    #createSphereBoundary(scale) {
        this.boundaryRadius = scale;

        const surfaceMaterial = new StandardMaterial('sphere-surface', this.scene);
        surfaceMaterial.diffuseColor = new Color3(0.2, 0.7, 1);
        surfaceMaterial.alpha = 0.08;
        surfaceMaterial.backFaceCulling = false;

        const borderMaterial = new StandardMaterial('sphere-border', this.scene);
        borderMaterial.diffuseColor = new Color3(0.1, 0.9, 1);
        borderMaterial.wireframe = true;
        borderMaterial.alpha = 0.5;

        this.surfaceSphere = MeshBuilder.CreateSphere(
            'sphere-surface-mesh',
            { diameter: BASE_SPHERE_RADIUS * 2, segments: 32 },
            this.scene
        );
        this.surfaceSphere.material = surfaceMaterial;

        this.borderSphere = MeshBuilder.CreateSphere(
            'sphere-border-mesh',
            { diameter: BASE_SPHERE_RADIUS * 2, segments: 16 },
            this.scene
        );
        this.borderSphere.material = borderMaterial;

        this.setSphereScale(scale);
    }

    #handlePointerDown(pointerInfo) {
        const pointerEvent = pointerInfo.event;
        if (pointerEvent.button !== 0) {
            return;
        }

        const pickInfo = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (mesh) => mesh === this.surfaceSphere || mesh === this.borderSphere
        );

        if (pickInfo?.hit && pickInfo.pickedPoint) {
            this.spawnCube(pickInfo.pickedPoint);
        }
    }

    #updateCubes() {
        this.cubes.forEach((cube) => {
            cube.position.addInPlace(cube.metadata.velocity);
            cube.rotation.x += cube.metadata.rotationVelocity.x;
            cube.rotation.y += cube.metadata.rotationVelocity.y;
            cube.rotation.z += cube.metadata.rotationVelocity.z;

            if (
                shouldBounceFromBoundary(
                    cube.position,
                    cube.metadata.velocity,
                    this.boundaryRadius,
                    cube.metadata.collisionRadius
                )
            ) {
                cube.metadata.velocity.scaleInPlace(-1);
            }
        });
    }

    #explodeCollidingCubes() {
        const collisionIndexes = collectCollisionIndexes(this.cubes.map((cube) => ({
            position: cube.position,
            collisionRadius: cube.metadata.collisionRadius
        })));

        collisionIndexes.forEach((index) => {
            const cube = this.cubes[index];
            this.#playExplosion(cube.position.clone());
            cube.dispose();
            this.cubes.splice(index, 1);
        });
    }

    #playExplosion(position) {
        const particleSystem = new ParticleSystem(`cube-explosion-${Date.now()}`, 120, this.scene);
        particleSystem.particleTexture = new Texture(EXPLOSION_TEXTURE_BASE64, this.scene);
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
        particleSystem.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
        particleSystem.color1 = new Color4(1, 0.3, 0.1, 1);
        particleSystem.color2 = new Color4(1, 0.8, 0.1, 1);
        particleSystem.colorDead = new Color4(0.1, 0.1, 0.1, 0);
        particleSystem.minSize = 0.08;
        particleSystem.maxSize = 0.22;
        particleSystem.minLifeTime = 0.1;
        particleSystem.maxLifeTime = 0.35;
        particleSystem.emitRate = 700;
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new Vector3(0, 0, 0);
        particleSystem.direction1 = new Vector3(-3, -3, -3);
        particleSystem.direction2 = new Vector3(3, 3, 3);
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 4;
        particleSystem.updateSpeed = 0.01;
        particleSystem.targetStopDuration = 0.12;
        particleSystem.start();

        setTimeout(() => {
            particleSystem.dispose();
        }, 450);
    }

    #handleResize() {
        this.engine?.resize();
    }
}

export const CUBES_EXPLODING_DEFAULTS = Object.freeze({
    sphereScale: DEFAULT_SPHERE_SCALE,
    maxCubes: DEFAULT_MAX_CUBES,
    minMaxCubes: CUBES_EXPLODING_CONSTANTS.MIN_MAX_CUBES,
    maxMaxCubes: CUBES_EXPLODING_CONSTANTS.MAX_MAX_CUBES
});
