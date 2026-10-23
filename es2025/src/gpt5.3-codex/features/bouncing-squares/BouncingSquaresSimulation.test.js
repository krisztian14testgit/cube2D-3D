import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BouncingSquaresSimulation } from './BouncingSquaresSimulation.js';

const ANIMATION_FRAME_ID = 77;
const CLICK_OFFSET_X = 100;
const CLICK_OFFSET_Y = 120;
const SECOND_CLICK_OFFSET_X = 150;
const THIRD_CLICK_OFFSET_X = 200;
const CORNER_CLICK_OFFSET = 1;
const EXPECTED_SQUARE_COUNT_AFTER_SINGLE_CLICK = 1;
const EXPECTED_COLLISION_FREE_SQUARE_COUNT = 0;
const EXPECTED_RECENT_SQUARES_COUNT_AFTER_LIMIT = 2;
const EXPECTED_SQUARE_COUNT_AFTER_STOPPED_CLICK = 0;
const EXPECTED_NON_COLLIDING_SQUARE_COUNT_AFTER_FRAME = 2;

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

    it('keeps only the most recent squares when maxSquares is reached', () => {
        const canvas = document.createElement('canvas');
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0 });
        canvas.getContext = vi.fn(() => createMockContext());
        document.body.appendChild(canvas);

        const simulation = new BouncingSquaresSimulation(canvas, { maxSquares: 2 });
        simulation.start();

        canvas.dispatchEvent(
            new MouseEvent('click', { bubbles: true, clientX: CLICK_OFFSET_X, clientY: CLICK_OFFSET_Y })
        );
        canvas.dispatchEvent(
            new MouseEvent('click', { bubbles: true, clientX: SECOND_CLICK_OFFSET_X, clientY: CLICK_OFFSET_Y })
        );
        canvas.dispatchEvent(
            new MouseEvent('click', { bubbles: true, clientX: THIRD_CLICK_OFFSET_X, clientY: CLICK_OFFSET_Y })
        );

        expect(simulation.squares.length).toBe(EXPECTED_RECENT_SQUARES_COUNT_AFTER_LIMIT);
        expect(simulation.squares[0].x).toBe(SECOND_CLICK_OFFSET_X);
        expect(simulation.squares[1].x).toBe(THIRD_CLICK_OFFSET_X);
    });

    it('bounces a square off the boundaries by inverting velocity and clamping position', () => {
        const canvas = document.createElement('canvas');
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0 });
        canvas.getContext = vi.fn(() => createMockContext());
        document.body.appendChild(canvas);

        const simulation = new BouncingSquaresSimulation(canvas);
        simulation.start();

        canvas.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                clientX: CORNER_CLICK_OFFSET,
                clientY: CORNER_CLICK_OFFSET
            })
        );

        const squareBeforeFrame = simulation.squares[0];
        expect(squareBeforeFrame.dx).toBeLessThan(0);
        expect(squareBeforeFrame.dy).toBeLessThan(0);

        animationCallback();

        const squareAfterFrame = simulation.squares[0];
        expect(squareAfterFrame.dx).toBeGreaterThan(0);
        expect(squareAfterFrame.dy).toBeGreaterThan(0);
        expect(squareAfterFrame.x).toBeGreaterThanOrEqual(squareAfterFrame.size / 2);
        expect(squareAfterFrame.y).toBeGreaterThanOrEqual(squareAfterFrame.size / 2);
    });

    it('does not add new squares after stop removes click listeners', () => {
        const canvas = document.createElement('canvas');
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0 });
        canvas.getContext = vi.fn(() => createMockContext());
        document.body.appendChild(canvas);

        const simulation = new BouncingSquaresSimulation(canvas);
        simulation.start();
        simulation.stop();

        canvas.dispatchEvent(
            new MouseEvent('click', { bubbles: true, clientX: CLICK_OFFSET_X, clientY: CLICK_OFFSET_Y })
        );

        expect(simulation.squares.length).toBe(EXPECTED_SQUARE_COUNT_AFTER_STOPPED_CLICK);
    });

    it('stops cleanly when the canvas is disconnected during animation', () => {
        const canvas = document.createElement('canvas');
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0 });
        canvas.getContext = vi.fn(() => createMockContext());
        document.body.appendChild(canvas);

        const simulation = new BouncingSquaresSimulation(canvas);
        simulation.start();

        canvas.remove();
        animationCallback();

        expect(cancelAnimationFrameMock).toHaveBeenCalledWith(ANIMATION_FRAME_ID);
        expect(simulation.animationFrameId).toBeNull();
    });

    it('does not remove non-colliding squares', () => {
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
            new MouseEvent('click', { bubbles: true, clientX: THIRD_CLICK_OFFSET_X, clientY: CLICK_OFFSET_Y })
        );

        animationCallback();

        expect(simulation.squares.length).toBe(EXPECTED_NON_COLLIDING_SQUARE_COUNT_AFTER_FRAME);
    });
});
