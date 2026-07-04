import {
    DEFAULT_CUBE_SCALE,
    DEFAULT_ROTATION_AXIS,
    DEFAULT_ROTATION_SPEED,
    createInitialCubeState,
    isValidFaceIndex,
    isValidRotationAxis
} from './CubeState.js';

export class CubeController {
    constructor(scene, { state = createInitialCubeState() } = {}) {
        if (!scene) {
            throw new Error('CubeController requires a ThreeCubeScene instance');
        }

        this.scene = scene;
        this.state = state;
    }

    createCubeAtPointer(event) {
        const hasCreatedCube = this.scene.createCubeAtPointer(event, {
            faceColors: this.state.faceColors
        });
        if (!hasCreatedCube) {
            return false;
        }

        this.state.hasCube = true;
        this.scene.setCubeScale(this.state.scale);
        this.scene.setRotationAxis(this.state.rotationAxis);
        this.scene.setRotationSpeed(this.state.rotationSpeed);
        this.state.faceColors.forEach((color, faceIndex) => {
            this.scene.setFaceColor(faceIndex, color);
        });

        return true;
    }

    setScale(scale) {
        if (!this.state.hasCube || !Number.isFinite(scale) || scale <= 0) {
            return false;
        }

        this.state.scale = scale;
        this.scene.setCubeScale(scale);
        return true;
    }

    setRotationAxis(rotationAxis) {
        if (!this.state.hasCube || !isValidRotationAxis(rotationAxis)) {
            return false;
        }

        this.state.rotationAxis = rotationAxis;
        this.scene.setRotationAxis(rotationAxis);
        return true;
    }

    setRotationSpeed(rotationSpeed) {
        if (!this.state.hasCube || !Number.isFinite(rotationSpeed) || rotationSpeed < 0) {
            return false;
        }

        this.state.rotationSpeed = rotationSpeed;
        this.scene.setRotationSpeed(rotationSpeed);
        return true;
    }

    setFaceColor(faceIndex, color) {
        if (!this.state.hasCube || !isValidFaceIndex(faceIndex) || typeof color !== 'string') {
            return false;
        }

        this.state.faceColors[faceIndex] = color;
        this.scene.setFaceColor(faceIndex, color);
        return true;
    }

    resetCubeTransform() {
        if (!this.state.hasCube) {
            return false;
        }

        this.state.scale = DEFAULT_CUBE_SCALE;
        this.state.rotationAxis = DEFAULT_ROTATION_AXIS;
        this.state.rotationSpeed = DEFAULT_ROTATION_SPEED;
        return this.scene.resetCubeTransform({
            scale: this.state.scale,
            rotationAxis: this.state.rotationAxis,
            rotationSpeed: this.state.rotationSpeed
        });
    }
}
