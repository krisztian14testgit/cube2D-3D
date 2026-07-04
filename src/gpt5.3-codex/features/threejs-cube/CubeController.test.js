import { describe, expect, it, vi } from 'vitest';
import { CubeController } from './CubeController.js';

function createSceneMock() {
    return {
        createCubeAtPointer: vi.fn(),
        setCubeScale: vi.fn(),
        setRotationAxis: vi.fn(),
        setRotationSpeed: vi.fn(),
        setFaceColor: vi.fn()
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
        expect(scene.setCubeScale).not.toHaveBeenCalled();
        expect(scene.setRotationAxis).not.toHaveBeenCalled();
        expect(scene.setRotationSpeed).not.toHaveBeenCalled();
        expect(scene.setFaceColor).not.toHaveBeenCalled();
    });

    it('creates one cube and applies default state', () => {
        const scene = createSceneMock();
        scene.createCubeAtPointer.mockReturnValue(true);
        const controller = new CubeController(scene);
        const clickEvent = new MouseEvent('click', { clientX: 100, clientY: 120 });

        expect(controller.createCubeAtPointer(clickEvent)).toBe(true);
        expect(controller.createCubeAtPointer(clickEvent)).toBe(false);
        expect(scene.createCubeAtPointer).toHaveBeenCalledTimes(1);
        expect(scene.setCubeScale).toHaveBeenCalledWith(1);
        expect(scene.setRotationAxis).toHaveBeenCalledWith('x');
        expect(scene.setRotationSpeed).toHaveBeenCalledWith(0.05);
        expect(scene.setFaceColor).toHaveBeenCalledTimes(6);
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
