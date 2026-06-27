import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BouncingSquaresSimulation } from './BouncingSquaresSimulation.js';

const ANIMATION_FRAME_ID = 77;
const CLICK_OFFSET_X = 100;
const CLICK_OFFSET_Y = 120;
const EXPECTED_SQUARE_COUNT_AFTER_SINGLE_CLICK = 1;
const EXPECTED_COLLISION_FREE_SQUARE_COUNT = 0;

function createMockContext() {
    return {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fillText: vi.fn(),
        clearRect: vi.fn(),
        save: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        strokeRect: vi.fn(),
        restore: vi.fn(),
        font: '',
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1
    };
}

describe('BouncingSquaresSimulation', () => {
    let animationCallback = null;
    let cancelAnimationFrameMock;

    beforeEach(() => {
        document.body.innerHTML = '';
        animationCallback = null;

        vi.spyOn(Math, 'random').mockReturnValue(0);

        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn((callback) => {
                animationCallback = callback;
                return ANIMATION_FRAME_ID;
            })
        );

        cancelAnimationFrameMock = vi.fn();
        vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameMock);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('adds a square from click input and draws it on the next animation frame', () => {
        const canvas = document.createElement('canvas');
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0 });
        canvas.getContext = vi.fn(() => createMockContext());
        document.body.appendChild(canvas);

        const simulation = new BouncingSquaresSimulation(canvas);
        simulation.start();

        canvas.dispatchEvent(
            new MouseEvent('click', { bubbles: true, clientX: CLICK_OFFSET_X, clientY: CLICK_OFFSET_Y })
        );

        expect(simulation.squares.length).toBe(EXPECTED_SQUARE_COUNT_AFTER_SINGLE_CLICK);

        animationCallback();
        expect(simulation.coordSystem.ctx.strokeRect).toHaveBeenCalled();
    });

    it('removes colliding squares and stops the animation loop cleanly', () => {
        const canvas = document.createElement('canvas');
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0 });
        canvas.getContext = vi.fn(() => createMockContext());
        document.body.appendChild(canvas);

        const simulation = new BouncingSquaresSimulation(canvas);
        simulation.start();

        canvas.dispatchEvent(
            new MouseEvent('click', { bubbles: true, clientX: CLICK_OFFSET_X, clientY: CLICK_OFFSET_Y })
        );
        canvas.dispatchEvent(
            new MouseEvent('click', { bubbles: true, clientX: CLICK_OFFSET_X, clientY: CLICK_OFFSET_Y })
        );

        animationCallback();
        expect(simulation.squares.length).toBe(EXPECTED_COLLISION_FREE_SQUARE_COUNT);

        simulation.stop();
        expect(cancelAnimationFrameMock).toHaveBeenCalledWith(ANIMATION_FRAME_ID);
    });
});
