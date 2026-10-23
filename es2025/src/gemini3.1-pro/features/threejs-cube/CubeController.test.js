import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CubeController } from './CubeController.js';
import { CubeState } from './CubeState.js';

describe('CubeController', () => {
    let sceneManagerMock;
    let state;
    let controller;

    beforeEach(() => {
        // Setup mock DOM elements for testing
        document.body.innerHTML = `
            <input type="range" id="scale-x" value="1">
            <input type="range" id="scale-y" value="1">
            <input type="range" id="scale-z" value="1">
            <input type="checkbox" id="rot-x">
            <input type="checkbox" id="rot-y" checked>
            <input type="checkbox" id="rot-z">
            <input type="range" id="rot-speed" value="0.02">
            <input type="color" id="cube-color" value="#add8e6">
        `;

        sceneManagerMock = {
            registerRenderLoopCallback: vi.fn(),
            updateCubeTransforms: vi.fn(),
            applyRotation: vi.fn()
        };

        state = new CubeState();
        controller = new CubeController(sceneManagerMock, state);
    });

    it('should register render loop callback on initialization', () => {
        expect(sceneManagerMock.registerRenderLoopCallback).toHaveBeenCalled();
        
        // Execute the registered callback to ensure it calls applyRotation
        const callback = sceneManagerMock.registerRenderLoopCallback.mock.calls[0][0];
        callback();
        expect(sceneManagerMock.applyRotation).toHaveBeenCalledWith(state);
    });

    it('should bind controls and update state/scene on scale input', () => {
        controller.bindControls();

        // Simulate scale-x input
        const scaleXEl = document.getElementById('scale-x');
        scaleXEl.value = '2';
        scaleXEl.dispatchEvent(new Event('input'));
        
        expect(state.scale.x).toBe(2);
        expect(sceneManagerMock.updateCubeTransforms).toHaveBeenCalledWith(state);

        // Simulate scale-y input
        const scaleYEl = document.getElementById('scale-y');
        scaleYEl.value = '3';
        scaleYEl.dispatchEvent(new Event('input'));
        
        expect(state.scale.y).toBe(3);

        // Simulate scale-z input
        const scaleZEl = document.getElementById('scale-z');
        scaleZEl.value = '4';
        scaleZEl.dispatchEvent(new Event('input'));
        
        expect(state.scale.z).toBe(4);
    });

    it('should bind controls and update state on rotation axis change', () => {
        controller.bindControls();

        const rotXEl = document.getElementById('rot-x');
        rotXEl.checked = true;
        rotXEl.dispatchEvent(new Event('change'));
        expect(state.rotationAxis.x).toBe(true);

        const rotYEl = document.getElementById('rot-y');
        rotYEl.checked = false;
        rotYEl.dispatchEvent(new Event('change'));
        expect(state.rotationAxis.y).toBe(false);

        const rotZEl = document.getElementById('rot-z');
        rotZEl.checked = true;
        rotZEl.dispatchEvent(new Event('change'));
        expect(state.rotationAxis.z).toBe(true);
    });

    it('should bind controls and update state on rotation speed input', () => {
        controller.bindControls();

        const speedEl = document.getElementById('rot-speed');
        speedEl.value = '0.05';
        speedEl.dispatchEvent(new Event('input'));
        
        expect(state.rotationSpeed).toBe(0.05);
    });

    it('should bind controls and update state/scene on color input', () => {
        controller.bindControls();

        const colorEl = document.getElementById('cube-color');
        colorEl.value = '#ff0000';
        colorEl.dispatchEvent(new Event('input'));
        
        expect(state.color).toBe('#ff0000');
        expect(sceneManagerMock.updateCubeTransforms).toHaveBeenCalledWith(state);
    });
});
