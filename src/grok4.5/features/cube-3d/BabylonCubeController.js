import * as BABYLON from '@babylonjs/core';

const DEFAULT_AXIS_LENGTH = 4;
const DEFAULT_ROTATION_AXIS = 'y';
const DEFAULT_ROTATION_SPEED = 1;
const DEFAULT_CUBE_COLOR = '#87cefa';

function drawCoordinateAxes(scene, axisLength) {
    BABYLON.MeshBuilder.CreateLines(
        'x-axis',
        {
            points: [
                new BABYLON.Vector3(-axisLength, 0, 0),
                new BABYLON.Vector3(axisLength, 0, 0)
            ]
        },
        scene
    ).color = new BABYLON.Color3(1, 0, 0);

    BABYLON.MeshBuilder.CreateLines(
        'y-axis',
        {
            points: [
                new BABYLON.Vector3(0, -axisLength, 0),
                new BABYLON.Vector3(0, axisLength, 0)
            ]
        },
        scene
    ).color = new BABYLON.Color3(0, 1, 0);

    BABYLON.MeshBuilder.CreateLines(
        'z-axis',
        {
            points: [
                new BABYLON.Vector3(0, 0, -axisLength),
                new BABYLON.Vector3(0, 0, axisLength)
            ]
        },
        scene
    ).color = new BABYLON.Color3(0, 0, 1);
}

/**
 * Owns Babylon engine/scene lifecycle and cube transform behavior.
 */
export class BabylonCubeController {
    #resizeHandler;

    constructor(canvas, {
        rotationAxis = DEFAULT_ROTATION_AXIS,
        rotationSpeed = DEFAULT_ROTATION_SPEED,
        cubeColor = DEFAULT_CUBE_COLOR,
        axisLength = DEFAULT_AXIS_LENGTH
    } = {}) {
        this.canvas = canvas;
        this.rotationAxis = rotationAxis;
        this.rotationSpeed = rotationSpeed;
        this.cubeColor = cubeColor;
        this.axisLength = axisLength;

        this.engine = null;
        this.scene = null;
        this.cube = null;
        this.cubeMaterial = null;
        this.#resizeHandler = this.#handleResize.bind(this);
    }

    init() {
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);

        const camera = new BABYLON.ArcRotateCamera(
            'camera',
            Math.PI / 4,
            Math.PI / 3,
            12,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        camera.attachControl(this.canvas, true);

        new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
        drawCoordinateAxes(this.scene, this.axisLength);

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.cube) {
                return;
            }

            const deltaTimeInSeconds = this.engine.getDeltaTime() / 1000;
            const rotationStep = this.rotationSpeed * deltaTimeInSeconds;

            switch (this.rotationAxis) {
                case 'x':
                    this.cube.rotation.x += rotationStep;
                    break;
                case 'z':
                    this.cube.rotation.z += rotationStep;
                    break;
                case 'y':
                default:
                    this.cube.rotation.y += rotationStep;
                    break;
            }
        });

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        window.addEventListener('resize', this.#resizeHandler);
    }

    createCubeIfMissing() {
        if (this.cube) {
            return false;
        }

        this.cube = BABYLON.MeshBuilder.CreateBox('interactive-cube', { size: 1 }, this.scene);
        this.cube.position = new BABYLON.Vector3(0, 0, 0);

        this.cubeMaterial = new BABYLON.StandardMaterial('interactive-cube-material', this.scene);
        this.setCubeColor(this.cubeColor);
        this.cube.material = this.cubeMaterial;
        return true;
    }

    setCubeScale(scale) {
        if (!this.cube) {
            return;
        }

        this.cube.scaling = new BABYLON.Vector3(scale, scale, scale);
    }

    setRotationAxis(axis) {
        this.rotationAxis = axis;
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    setCubeColor(colorHex) {
        this.cubeColor = colorHex;
        if (this.cubeMaterial) {
            this.cubeMaterial.diffuseColor = BABYLON.Color3.FromHexString(colorHex);
        }
    }

    dispose() {
        window.removeEventListener('resize', this.#resizeHandler);
        this.engine?.dispose();
        this.engine = null;
        this.scene = null;
        this.cube = null;
        this.cubeMaterial = null;
    }

    #handleResize() {
        this.engine?.resize();
    }
}

export function createBabylonCubeController(canvas, options) {
    const controller = new BabylonCubeController(canvas, options);
    controller.init();
    return controller;
}

export {
    DEFAULT_AXIS_LENGTH,
    DEFAULT_ROTATION_AXIS,
    DEFAULT_ROTATION_SPEED,
    DEFAULT_CUBE_COLOR
};
