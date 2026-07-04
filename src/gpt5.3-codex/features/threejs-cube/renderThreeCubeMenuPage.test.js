import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_CUBE_SCALE,
    DEFAULT_ROTATION_AXIS,
    DEFAULT_ROTATION_SPEED
} from './CubeState.js';
import {
    renderThreeCubeMenuPage,
    THREE_CUBE_MENU_IDS
} from './renderThreeCubeMenuPage.js';

class FakeScene {
    static instances = [];

    constructor({ canvas }) {
        this.canvas = canvas;
        this.initialize = vi.fn(() => this);
        this.dispose = vi.fn();
        FakeScene.instances.push(this);
    }
}

class FakeController {
    static instances = [];

    constructor(scene) {
        this.scene = scene;
        this.createCubeAtPointer = vi.fn(() => false);
        this.setScale = vi.fn();
        this.setRotationAxis = vi.fn();
        this.setRotationSpeed = vi.fn();
        this.resetCubeTransform = vi.fn(() => true);
        this.setFaceColor = vi.fn();
        FakeController.instances.push(this);
    }
}

function getControlElements(container) {
    return {
        canvas: container.querySelector(`#${THREE_CUBE_MENU_IDS.canvas}`),
        scaleInput: container.querySelector(`#${THREE_CUBE_MENU_IDS.scale}`),
        rotationAxisSelect: container.querySelector(`#${THREE_CUBE_MENU_IDS.rotationAxis}`),
        rotationSpeedInput: container.querySelector(`#${THREE_CUBE_MENU_IDS.rotationSpeed}`),
        resetButton: container.querySelector(`#${THREE_CUBE_MENU_IDS.reset}`),
        firstFaceColorInput: container.querySelector(`#${THREE_CUBE_MENU_IDS.faceColors[0]}`)
    };
}

describe('renderThreeCubeMenuPage', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        FakeScene.instances = [];
        FakeController.instances = [];
    });

    it('renders title, canvas, and disabled controls initially', () => {
        const container = document.createElement('section');
        document.body.appendChild(container);

        renderThreeCubeMenuPage(container, {
            title: 'Menu 5 - 3D cube by GPT-5.3 Codex',
            SceneClass: FakeScene,
            ControllerClass: FakeController
        });
        const controls = getControlElements(container);

        expect(container.querySelector('h2')?.textContent).toContain('Menu 5 - 3D cube by GPT-5.3 Codex');
        expect(controls.canvas).not.toBeNull();
        expect(controls.scaleInput.disabled).toBe(true);
        expect(controls.rotationAxisSelect.disabled).toBe(true);
        expect(controls.rotationSpeedInput.disabled).toBe(true);
        expect(controls.resetButton.disabled).toBe(true);
        expect(controls.firstFaceColorInput.disabled).toBe(true);
    });

    it('enables controls after the first successful cube creation click', () => {
        const container = document.createElement('section');
        document.body.appendChild(container);

        renderThreeCubeMenuPage(container, {
            SceneClass: FakeScene,
            ControllerClass: FakeController
        });

        const controller = FakeController.instances[0];
        controller.createCubeAtPointer.mockReturnValue(true);
        const controls = getControlElements(container);

        controls.canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 200, clientY: 150 }));

        expect(controller.createCubeAtPointer).toHaveBeenCalledTimes(1);
        expect(controls.scaleInput.disabled).toBe(false);
        expect(controls.rotationAxisSelect.disabled).toBe(false);
        expect(controls.rotationSpeedInput.disabled).toBe(false);
        expect(controls.resetButton.disabled).toBe(false);
        expect(controls.firstFaceColorInput.disabled).toBe(false);
    });

    it('creates cube from right click and prevents context menu default action', () => {
        const container = document.createElement('section');
        document.body.appendChild(container);

        renderThreeCubeMenuPage(container, {
            SceneClass: FakeScene,
            ControllerClass: FakeController
        });

        const controller = FakeController.instances[0];
        controller.createCubeAtPointer.mockReturnValue(true);
        const controls = getControlElements(container);

        const rightClickEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: 200,
            clientY: 150,
            button: 2
        });
        const wasNotCanceled = controls.canvas.dispatchEvent(rightClickEvent);

        expect(wasNotCanceled).toBe(false);
        expect(rightClickEvent.defaultPrevented).toBe(true);
        expect(controller.createCubeAtPointer).toHaveBeenCalledTimes(1);
        expect(controls.scaleInput.disabled).toBe(false);
    });

    it('forwards normalized UI values to the cube controller and disposes scene', () => {
        const container = document.createElement('section');
        document.body.appendChild(container);

        const page = renderThreeCubeMenuPage(container, {
            SceneClass: FakeScene,
            ControllerClass: FakeController
        });

        const scene = FakeScene.instances[0];
        const controller = FakeController.instances[0];
        const controls = getControlElements(container);

        controller.createCubeAtPointer.mockReturnValue(true);
        controls.canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 200, clientY: 150 }));

        controls.scaleInput.value = '2.4';
        controls.scaleInput.dispatchEvent(new Event('input', { bubbles: true }));

        controls.rotationAxisSelect.value = 'z';
        controls.rotationAxisSelect.dispatchEvent(new Event('change', { bubbles: true }));

        controls.rotationSpeedInput.value = '0.12';
        controls.rotationSpeedInput.dispatchEvent(new Event('input', { bubbles: true }));

        controls.firstFaceColorInput.value = '#000000';
        controls.firstFaceColorInput.dispatchEvent(new Event('input', { bubbles: true }));

        expect(controller.setScale).toHaveBeenCalledWith(2.4);
        expect(controller.setRotationAxis).toHaveBeenCalledWith('z');
        expect(controller.setRotationSpeed).toHaveBeenCalledWith(0.12);
        expect(controller.setFaceColor).toHaveBeenCalledWith(0, '#000000');

        controls.resetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(controller.resetCubeTransform).toHaveBeenCalledTimes(1);
        expect(controls.scaleInput.value).toBe(String(DEFAULT_CUBE_SCALE));
        expect(controls.rotationAxisSelect.value).toBe(DEFAULT_ROTATION_AXIS);
        expect(controls.rotationSpeedInput.value).toBe(String(DEFAULT_ROTATION_SPEED));

        page.dispose();
        expect(scene.dispose).toHaveBeenCalledTimes(1);
    });
});
