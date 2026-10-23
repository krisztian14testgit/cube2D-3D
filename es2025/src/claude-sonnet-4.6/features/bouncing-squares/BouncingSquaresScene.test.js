import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BouncingSquaresScene } from './BouncingSquaresScene.js';
import { SquareModel } from './SquareModel.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const CANVAS_W = 500;
const CANVAS_H = 500;
const MOCK_ANIMATION_ID = 42; // value returned by the mocked requestAnimationFrame

/** Minimal HTMLCanvasElement mock. */
function makeCanvasMock(width = CANVAS_W, height = CANVAS_H) {
    return {
        width,
        height,
        addEventListener:       vi.fn(),
        getBoundingClientRect:  vi.fn(() => ({ left: 0, top: 0 })),
    };
}

/** Minimal CoordinateSystem mock. */
function makeCoordSystemMock() {
    return {
        draw:        vi.fn(),
        clearCanvas: vi.fn(),
        ctx:         {},
    };
}

/** Minimal PhysicsEngine mock — removeColliding passes squares through by default. */
function makePhysicsEngineMock() {
    return {
        bounce:           vi.fn(),
        removeColliding:  vi.fn(squares => squares),
    };
}

/** Minimal SquareRenderer mock. */
function makeRendererMock() {
    return {
        draw: vi.fn(),
    };
}

/** Helper: build a real SquareModel with sensible defaults. */
function makeSquare(overrides = {}) {
    return new SquareModel({
        x: 100, y: 100, size: 40, dx: 2, dy: 2, rotationSpeed: 0.01,
        ...overrides,
    });
}

// ── BouncingSquaresScene ──────────────────────────────────────────────────────

describe('BouncingSquaresScene', () => {
    let canvas;
    let coordSystem;
    let physicsEngine;
    let renderer;
    let scene;

    beforeEach(() => {
        canvas        = makeCanvasMock();
        coordSystem   = makeCoordSystemMock();
        physicsEngine = makePhysicsEngineMock();
        renderer      = makeRendererMock();
        scene         = new BouncingSquaresScene(canvas, coordSystem, physicsEngine, renderer);

        // Prevent real rAF from running in tests
        vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(MOCK_ANIMATION_ID);
        vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ── constructor ───────────────────────────────────────────────────────────

    describe('constructor', () => {
        it('stores the canvas reference', () => {
            expect(scene._canvas).toBe(canvas);
        });

        it('stores the coordSystem reference', () => {
            expect(scene._coordSystem).toBe(coordSystem);
        });

        it('stores the physicsEngine reference', () => {
            expect(scene._physicsEngine).toBe(physicsEngine);
        });

        it('stores the renderer reference', () => {
            expect(scene._renderer).toBe(renderer);
        });

        it('initialises _squares as an empty array', () => {
            expect(scene._squares).toEqual([]);
        });

        it('initialises _animationId as null', () => {
            expect(scene._animationId).toBeNull();
        });
    });

    // ── start ─────────────────────────────────────────────────────────────────

    describe('start()', () => {
        it('attaches a click listener to the canvas', () => {
            scene.start();
            expect(canvas.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('calls coordSystem.draw() to render the initial frame', () => {
            scene.start();
            expect(coordSystem.draw).toHaveBeenCalledOnce();
        });

        it('requests the first animation frame', () => {
            scene.start();
            expect(requestAnimationFrame).toHaveBeenCalledWith(scene._bound_onFrame);
        });

        it('stores the animation id returned by requestAnimationFrame', () => {
            scene.start();
            expect(scene._animationId).toBe(MOCK_ANIMATION_ID);
        });
    });

    // ── stop ──────────────────────────────────────────────────────────────────

    describe('stop()', () => {
        it('calls cancelAnimationFrame with the stored id', () => {
            scene.start();                 // _animationId = MOCK_ANIMATION_ID
            scene.stop();
            expect(cancelAnimationFrame).toHaveBeenCalledWith(MOCK_ANIMATION_ID);
        });

        it('sets _animationId to null after stopping', () => {
            scene.start();
            scene.stop();
            expect(scene._animationId).toBeNull();
        });

        it('does nothing when the animation is not running (_animationId is null)', () => {
            scene.stop();   // _animationId is still null — must not throw
            expect(cancelAnimationFrame).not.toHaveBeenCalled();
        });
    });

    // ── spawnSquare ───────────────────────────────────────────────────────────

    describe('spawnSquare()', () => {
        const SPAWN_X_A        = 100;   // x-coordinate for the first single-spawn test
        const SPAWN_Y_A        = 200;   // y-coordinate for the first single-spawn test
        const SPAWN_X_B        = 123;   // x-coordinate for the coordinate-check test
        const SPAWN_Y_B        = 456;   // y-coordinate for the coordinate-check test
        const MIN_SQUARE_SIZE  = 20;    // lower bound: Math.random() * 40 + 20
        const MAX_SQUARE_SIZE  = 60;    // upper bound: Math.random() * 40 + 20
        const MIN_SQUARE_SPEED = 1;     // lower bound: Math.random() * 2 + 1
        const MAX_SQUARE_SPEED = 3;     // upper bound: Math.random() * 2 + 1
        const SPAWN_COUNT      = 3;     // number of squares accumulated in the multi-spawn test

        it('adds one square to the _squares array', () => {
            scene.spawnSquare(SPAWN_X_A, SPAWN_Y_A);
            expect(scene._squares).toHaveLength(1);
        });

        it('sets the spawned square x and y to the given coordinates', () => {
            scene.spawnSquare(SPAWN_X_B, SPAWN_Y_B);
            expect(scene._squares[0].x).toBe(SPAWN_X_B);
            expect(scene._squares[0].y).toBe(SPAWN_Y_B);
        });

        it('spawns a square with size in the range 20–60 px', () => {
            scene.spawnSquare(0, 0);
            const { size } = scene._squares[0];
            expect(size).toBeGreaterThanOrEqual(MIN_SQUARE_SIZE);
            expect(size).toBeLessThanOrEqual(MAX_SQUARE_SIZE);
        });

        it('spawns a square with a non-zero velocity', () => {
            scene.spawnSquare(0, 0);
            const { dx, dy } = scene._squares[0];
            const speed = Math.hypot(dx, dy);
            expect(speed).toBeGreaterThan(0);
        });

        it('spawns a square with speed in the range 1–3 px/frame', () => {
            // Run many times to exercise randomness
            for (let i = 0; i < 50; i++) {
                scene._squares = [];
                scene.spawnSquare(0, 0);
                const { dx, dy } = scene._squares[0];
                const speed = Math.hypot(dx, dy);
                expect(speed).toBeGreaterThanOrEqual(MIN_SQUARE_SPEED);
                expect(speed).toBeLessThanOrEqual(MAX_SQUARE_SPEED);
            }
        });

        it('accumulates multiple squares on repeated calls', () => {
            scene.spawnSquare(10, 10);
            scene.spawnSquare(200, 200);
            scene.spawnSquare(400, 400);
            expect(scene._squares).toHaveLength(SPAWN_COUNT);
        });
    });

    // ── _onCanvasClick ────────────────────────────────────────────────────────

    describe('_onCanvasClick()', () => {
        // First test — offset rect
        const RECT_OFFSET_LEFT_A   = 50;
        const RECT_OFFSET_TOP_A    = 30;
        const CLIENT_X_A           = 150;
        const CLIENT_Y_A           = 130;
        const EXPECTED_CANVAS_X_A  = 100;  // CLIENT_X_A - RECT_OFFSET_LEFT_A = 150 - 50
        const EXPECTED_CANVAS_Y_A  = 100;  // CLIENT_Y_A - RECT_OFFSET_TOP_A  = 130 - 30

        // Second test — top offset only
        const RECT_OFFSET_TOP_B    = 100;
        const CLIENT_X_B           = 200;
        const CLIENT_Y_B           = 250;
        const EXPECTED_CANVAS_X_B  = 200;  // CLIENT_X_B - 0 = 200
        const EXPECTED_CANVAS_Y_B  = 150;  // CLIENT_Y_B - RECT_OFFSET_TOP_B = 250 - 100

        // Third test — no rect offset (default mock: left=0, top=0)
        const CLIENT_X_C           = 60;
        const CLIENT_Y_C           = 70;

        it('spawns a square at the click position relative to the canvas', () => {
            canvas.getBoundingClientRect.mockReturnValue({ left: RECT_OFFSET_LEFT_A, top: RECT_OFFSET_TOP_A });
            const spySpawn = vi.spyOn(scene, 'spawnSquare');

            scene._onCanvasClick({ clientX: CLIENT_X_A, clientY: CLIENT_Y_A });

            expect(spySpawn).toHaveBeenCalledWith(EXPECTED_CANVAS_X_A, EXPECTED_CANVAS_Y_A);
        });

        it('accounts for a non-zero canvas offset', () => {
            canvas.getBoundingClientRect.mockReturnValue({ left: 0, top: RECT_OFFSET_TOP_B });
            const spySpawn = vi.spyOn(scene, 'spawnSquare');

            scene._onCanvasClick({ clientX: CLIENT_X_B, clientY: CLIENT_Y_B });

            expect(spySpawn).toHaveBeenCalledWith(EXPECTED_CANVAS_X_B, EXPECTED_CANVAS_Y_B);
        });

        it('is wired up as the canvas click handler after start()', () => {
            scene.start();
            const [event, handler] = canvas.addEventListener.mock.calls[0];
            expect(event).toBe('click');

            const spySpawn = vi.spyOn(scene, 'spawnSquare');
            handler({ clientX: CLIENT_X_C, clientY: CLIENT_Y_C }); // left=0, top=0 from mock
            expect(spySpawn).toHaveBeenCalledWith(CLIENT_X_C, CLIENT_Y_C);
        });
    });

    // ── _update ───────────────────────────────────────────────────────────────

    describe('_update()', () => {
        it('calls update() on every square', () => {
            const a = makeSquare({ x: 100, y: 100 });
            const b = makeSquare({ x: 300, y: 300 });
            vi.spyOn(a, 'update');
            vi.spyOn(b, 'update');
            scene._squares = [a, b];

            scene._update();

            expect(a.update).toHaveBeenCalledOnce();
            expect(b.update).toHaveBeenCalledOnce();
        });

        it('calls physicsEngine.bounce() for every square with canvas dimensions', () => {
            const a = makeSquare();
            const b = makeSquare();
            scene._squares = [a, b];

            scene._update();

            expect(physicsEngine.bounce).toHaveBeenCalledTimes(2);
            expect(physicsEngine.bounce).toHaveBeenCalledWith(a, CANVAS_W, CANVAS_H);
            expect(physicsEngine.bounce).toHaveBeenCalledWith(b, CANVAS_W, CANVAS_H);
        });

        it('replaces _squares with the result of removeColliding()', () => {
            const surviving = [makeSquare()];
            physicsEngine.removeColliding.mockReturnValue(surviving);
            scene._squares = [makeSquare(), makeSquare()];

            scene._update();

            expect(scene._squares).toBe(surviving);
        });

        it('passes the current squares array to removeColliding()', () => {
            const a = makeSquare();
            const b = makeSquare();
            scene._squares = [a, b];

            scene._update();

            expect(physicsEngine.removeColliding).toHaveBeenCalledWith([a, b]);
        });

        it('does not call bounce or update when _squares is empty', () => {
            scene._squares = [];
            scene._update();
            expect(physicsEngine.bounce).not.toHaveBeenCalled();
        });
    });

    // ── _draw ─────────────────────────────────────────────────────────────────

    describe('_draw()', () => {
        it('clears the canvas before drawing', () => {
            scene._draw();
            expect(coordSystem.clearCanvas).toHaveBeenCalledOnce();
        });

        it('redraws the coordinate system on every frame', () => {
            scene._draw();
            expect(coordSystem.draw).toHaveBeenCalledOnce();
        });

        it('calls renderer.draw() for every square with the ctx and the square', () => {
            const a = makeSquare();
            const b = makeSquare();
            scene._squares = [a, b];

            scene._draw();

            expect(renderer.draw).toHaveBeenCalledTimes(2);
            expect(renderer.draw).toHaveBeenCalledWith(coordSystem.ctx, a);
            expect(renderer.draw).toHaveBeenCalledWith(coordSystem.ctx, b);
        });

        it('does not call renderer.draw() when there are no squares', () => {
            scene._squares = [];
            scene._draw();
            expect(renderer.draw).not.toHaveBeenCalled();
        });

        it('clears the canvas before calling coordSystem.draw()', () => {
            const callOrder = [];
            coordSystem.clearCanvas.mockImplementation(() => callOrder.push('clear'));
            coordSystem.draw.mockImplementation(() => callOrder.push('draw'));

            scene._draw();

            expect(callOrder).toEqual(['clear', 'draw']);
        });
    });

    // ── _onFrame ──────────────────────────────────────────────────────────────

    describe('_onFrame()', () => {
        const NEXT_ANIMATION_ID = 99;  // id returned by rAF for the "updates _animationId" test

        it('calls _update() once per frame', () => {
            const spyUpdate = vi.spyOn(scene, '_update');
            scene._onFrame();
            expect(spyUpdate).toHaveBeenCalledOnce();
        });

        it('calls _draw() once per frame', () => {
            const spyDraw = vi.spyOn(scene, '_draw');
            scene._onFrame();
            expect(spyDraw).toHaveBeenCalledOnce();
        });

        it('schedules the next animation frame after each tick', () => {
            scene._onFrame();
            expect(requestAnimationFrame).toHaveBeenCalledWith(scene._bound_onFrame);
        });

        it('updates _animationId with the new frame id', () => {
            requestAnimationFrame.mockReturnValue(NEXT_ANIMATION_ID);
            scene._onFrame();
            expect(scene._animationId).toBe(NEXT_ANIMATION_ID);
        });
    });
});
