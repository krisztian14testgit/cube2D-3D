import { describe, it, expect, beforeEach } from 'vitest';
import { CubeState } from './CubeState.js';

describe('CubeState', () => {
    let state;

    beforeEach(() => {
        state = new CubeState();
    });

    it('should initialize with default values', () => {
        expect(state.scale).toEqual({ x: 1, y: 1, z: 1 });
        expect(state.rotationAxis).toEqual({ x: false, y: true, z: false });
        expect(state.rotationSpeed).toBe(0.02);
        expect(state.color).toBe('#add8e6');
    });

    it('should set scale correctly or keep previous if NaN', () => {
        state.setScale(2, 3, 4.5);
        expect(state.scale).toEqual({ x: 2, y: 3, z: 4.5 });

        // Partial update
        state.setScale(undefined, 5, undefined);
        expect(state.scale).toEqual({ x: 2, y: 5, z: 4.5 });

        // Negative test (NaN values should be ignored)
        state.setScale('abc', null, NaN);
        expect(state.scale).toEqual({ x: 2, y: 5, z: 4.5 });
    });

    it('should set rotation axis correctly', () => {
        state.setRotationAxis('x', true);
        expect(state.rotationAxis).toEqual({ x: true, y: true, z: false });

        state.setRotationAxis('y', false);
        expect(state.rotationAxis).toEqual({ x: true, y: false, z: false });
        
        // Invalid axis should not throw or add new props
        state.setRotationAxis('w', true);
        expect(state.rotationAxis.w).toBeUndefined();
    });

    it('should set rotation speed correctly or keep previous if NaN', () => {
        state.setRotationSpeed(0.05);
        expect(state.rotationSpeed).toBe(0.05);
        
        state.setRotationSpeed('0.1'); // handle str parsing
        expect(state.rotationSpeed).toBe(0.1);

        // Negative test (NaN)
        state.setRotationSpeed('fast');
        expect(state.rotationSpeed).toBe(0.1); 
    });

    it('should set color correctly or keep previous if invalid hex', () => {
        state.setColor('#ff0000');
        expect(state.color).toBe('#ff0000');

        // Negative test
        state.setColor('blue'); // invalid missing hash
        expect(state.color).toBe('#ff0000');

        state.setColor('#ff000'); // invalid length
        expect(state.color).toBe('#ff0000');
    });
});