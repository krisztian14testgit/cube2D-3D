import { Color } from 'three';

export const FACE_COUNT = 6;
export const ROTATION_AXES = Object.freeze(['x', 'y', 'z']);
export const DEFAULT_CUBE_SCALE = 1;
export const DEFAULT_ROTATION_AXIS = 'x';
export const DEFAULT_ROTATION_SPEED = 0.05;
export const DEFAULT_FACE_COLOR = `#${new Color('lightblue').getHexString()}`;

export function createInitialCubeState() {
    return {
        hasCube: false,
        scale: DEFAULT_CUBE_SCALE,
        rotationAxis: DEFAULT_ROTATION_AXIS,
        rotationSpeed: DEFAULT_ROTATION_SPEED,
        faceColors: Array.from({ length: FACE_COUNT }, () => DEFAULT_FACE_COLOR)
    };
}

export function isValidRotationAxis(rotationAxis) {
    return ROTATION_AXES.includes(rotationAxis);
}

export function isValidFaceIndex(faceIndex) {
    return Number.isInteger(faceIndex) && faceIndex >= 0 && faceIndex < FACE_COUNT;
}
