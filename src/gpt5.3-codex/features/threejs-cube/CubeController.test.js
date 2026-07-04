import { describe, expect, it, vi } from 'vitest';
import { CubeController } from './CubeController.js';
import {
    DEFAULT_CUBE_SCALE,
    DEFAULT_ROTATION_AXIS,
    DEFAULT_ROTATION_SPEED
} from './CubeState.js';

function createSceneMock() {
    return {
        createCubeAtPointer: vi.fn(),
        setCubeScale: vi.fn(),
        setRotationAxis: vi.fn(),
        setRotationSpeed: vi.fn(),
        setFaceColor: vi.fn(),
        resetCubeTransform: vi.fn(() => true)
    };
}

describe('CubeController', () => {
    it('ignores transform updates before a cube is created', () => {
        const scene = createSceneMock();
        const controller = new CubeController(scene);

        expect(controller.setScale(2)).toBe(false);
        expect(controller.setRotationAxis('z')).toBe(false);
        expect(controller.setRotationSpeed(0.1)).toBe(false);
        expect(controller.setFaceColor(0, '#111111')).toBe(false);
        expect(controller.resetCubeTransform()).toBe(false);
        expect(scene.setCubeScale).not.toHaveBeenCalled();
        expect(scene.setRotationAxis).not.toHaveBeenCalled();
        expect(scene.setRotationSpeed).not.toHaveBeenCalled();
        expect(scene.setFaceColor).not.toHaveBeenCalled();
        expect(scene.resetCubeTransform).not.toHaveBeenCalled();
    });

    it('creates or replaces the active cube and reapplies current state', () => {
        const scene = createSceneMock();
        scene.createCubeAtPointer.mockReturnValue(true);
        const controller = new CubeController(scene);
        const clickEvent = new MouseEvent('click', { clientX: 100, clientY: 120 });

        expect(controller.createCubeAtPointer(clickEvent)).toBe(true);
        expect(controller.createCubeAtPointer(clickEvent)).toBe(true);
        expect(scene.createCubeAtPointer).toHaveBeenCalledTimes(2);
        expect(scene.setCubeScale).toHaveBeenCalledWith(DEFAULT_CUBE_SCALE);
        expect(scene.setRotationAxis).toHaveBeenCalledWith(DEFAULT_ROTATION_AXIS);
        expect(scene.setRotationSpeed).toHaveBeenCalledWith(DEFAULT_ROTATION_SPEED);
        expect(scene.setFaceColor).toHaveBeenCalledTimes(12);
    });

    it('updates transforms and face colors after cube creation', () => {
        const scene = createSceneMock();
        scene.createCubeAtPointer.mockReturnValue(true);
        const controller = new CubeController(scene);

        controller.createCubeAtPointer(new MouseEvent('click', { clientX: 100, clientY: 120 }));

        expect(controller.setScale(2.4)).toBe(true);
        expect(controller.setRotationAxis('z')).toBe(true);
        expect(controller.setRotationSpeed(0.12)).toBe(true);
        expect(controller.setFaceColor(3, '#ff0000')).toBe(true);
        expect(scene.setCubeScale).toHaveBeenLastCalledWith(2.4);
        expect(scene.setRotationAxis).toHaveBeenLastCalledWith('z');
        expect(scene.setRotationSpeed).toHaveBeenLastCalledWith(0.12);
        expect(scene.setFaceColor).toHaveBeenLastCalledWith(3, '#ff0000');
    });

    it('resets transform state back to defaults', () => {
        const scene = createSceneMock();
        scene.createCubeAtPointer.mockReturnValue(true);
        const controller = new CubeController(scene);

        controller.createCubeAtPointer(new MouseEvent('click', { clientX: 100, clientY: 120 }));
        controller.setScale(2.4);
        controller.setRotationAxis('z');
        controller.setRotationSpeed(0.12);

        expect(controller.resetCubeTransform()).toBe(true);
        expect(scene.resetCubeTransform).toHaveBeenCalledWith({
            scale: DEFAULT_CUBE_SCALE,
            rotationAxis: DEFAULT_ROTATION_AXIS,
            rotationSpeed: DEFAULT_ROTATION_SPEED
        });
    });

    it('rejects invalid update payloads', () => {
        const scene = createSceneMock();
        scene.createCubeAtPointer.mockReturnValue(true);
        const controller = new CubeController(scene);

        controller.createCubeAtPointer(new MouseEvent('click', { clientX: 100, clientY: 120 }));

        expect(controller.setScale(0)).toBe(false);
        expect(controller.setRotationAxis('q')).toBe(false);
        expect(controller.setRotationSpeed(-1)).toBe(false);
        expect(controller.setFaceColor(6, '#ffffff')).toBe(false);
        expect(controller.setFaceColor(2, 123)).toBe(false);
    });
});
