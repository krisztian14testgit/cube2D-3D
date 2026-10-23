import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CoordinateSystem } from './CoordinateSystem.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_WIDTH  = 513;
const DEFAULT_HEIGHT = 513;
const DEFAULT_SCALE  = 9.5;

/**
 * Creates a minimal canvas mock with a tracked 2D context.
 * Allows testing drawing logic without a real browser canvas.
 */
function makeCanvasMock(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
    const ctx = {
        beginPath:  vi.fn(),
        moveTo:     vi.fn(),
        lineTo:     vi.fn(),
        stroke:     vi.fn(),
        clearRect:  vi.fn(),
        fillText:   vi.fn(),
        strokeStyle: '',
        lineWidth:   1,
        font:        '',
        fillStyle:   '',
    };
    const canvas = {
        width,
        height,
        getContext: vi.fn(() => ctx),
    };
    return { canvas, ctx };
}

// ── CoordinateSystem ─────────────────────────────────────────────────────────

describe('CoordinateSystem', () => {
    let cs;
    let canvas;
    let ctx;

    beforeEach(() => {
        ({ canvas, ctx } = makeCanvasMock());
        cs = new CoordinateSystem({ canvasElement: canvas });
    });

    // ── constructor ───────────────────────────────────────────────────────────

    describe('constructor', () => {
        const CUSTOM_CANVAS_WIDTH  = 800;
        const CUSTOM_CANVAS_HEIGHT = 600;
        const EXPECTED_ORIGIN_X    = Math.floor(DEFAULT_WIDTH  / 2); // 256
        const EXPECTED_ORIGIN_Y    = Math.floor(DEFAULT_HEIGHT / 2); // 256
        const EXPECTED_NUM_LINES_X = Math.floor(DEFAULT_WIDTH  / DEFAULT_SCALE); // 54
        const EXPECTED_NUM_LINES_Y = Math.floor(DEFAULT_HEIGHT / DEFAULT_SCALE); // 54

        it('stores the canvas reference and obtains a 2d context', () => {
            expect(canvas.getContext).toHaveBeenCalledWith('2d');
            expect(cs.ctx).toBe(ctx);
        });

        it('sets canvas width and height to the defaults (513 × 513)', () => {
            expect(canvas.width).toBe(DEFAULT_WIDTH);
            expect(canvas.height).toBe(DEFAULT_HEIGHT);
        });

        it('accepts custom width and height', () => {
            const { canvas: c } = makeCanvasMock(CUSTOM_CANVAS_WIDTH, CUSTOM_CANVAS_HEIGHT);
            const custom = new CoordinateSystem({ canvasElement: c, width: CUSTOM_CANVAS_WIDTH, height: CUSTOM_CANVAS_HEIGHT });
            expect(c.width).toBe(CUSTOM_CANVAS_WIDTH);
            expect(c.height).toBe(CUSTOM_CANVAS_HEIGHT);
        });

        it('computes _origin at the centre of the canvas', () => {
            expect(cs._origin.X).toBe(EXPECTED_ORIGIN_X);
            expect(cs._origin.Y).toBe(EXPECTED_ORIGIN_Y);
        });

        it('computes _numLinesX and _numLinesY from canvas size and scale', () => {
            expect(cs._numLinesX).toBe(EXPECTED_NUM_LINES_X);
            expect(cs._numLinesY).toBe(EXPECTED_NUM_LINES_Y);
        });

        it('sets _cubeProps to null before any cube is drawn', () => {
            expect(cs._cubeProps).toBeNull();
        });

        it('looks up the canvas by id when no canvasElement is provided', () => {
            const fakeCanvas = makeCanvasMock().canvas;
            vi.spyOn(document, 'getElementById').mockReturnValue(fakeCanvas);
            const byId = new CoordinateSystem({ canvasId: 'myCanvas' });
            expect(document.getElementById).toHaveBeenCalledWith('myCanvas');
            expect(byId._canvas).toBe(fakeCanvas);
            vi.restoreAllMocks();
        });

        it('throws when the canvas element cannot be found', () => {
            vi.spyOn(document, 'getElementById').mockReturnValue(null);
            expect(() => new CoordinateSystem({ canvasId: 'nonExistent' })).toThrow(
                'Canvas element not found'
            );
            vi.restoreAllMocks();
        });
    });

    // ── draw ─────────────────────────────────────────────────────────────────

    describe('draw()', () => {
        it('calls _drawGrids, _drawAxes, and _displayLabelNumbersOnAxes', () => {
            const spyGrids  = vi.spyOn(cs, '_drawGrids');
            const spyAxes   = vi.spyOn(cs, '_drawAxes');
            const spyLabels = vi.spyOn(cs, '_displayLabelNumbersOnAxes');

            cs.draw();

            expect(spyGrids).toHaveBeenCalledOnce();
            expect(spyAxes).toHaveBeenCalledOnce();
            expect(spyLabels).toHaveBeenCalledOnce();
        });

        it('calls ctx.stroke() at least once (grid lines and axes)', () => {
            cs.draw();
            expect(ctx.stroke).toHaveBeenCalled();
        });
    });

    // ── drawWithoutGrid ───────────────────────────────────────────────────────

    describe('drawWithoutGrid()', () => {
        it('calls _drawAxes and _displayLabelNumbersOnAxes', () => {
            const spyAxes   = vi.spyOn(cs, '_drawAxes');
            const spyLabels = vi.spyOn(cs, '_displayLabelNumbersOnAxes');

            cs.drawWithoutGrid();

            expect(spyAxes).toHaveBeenCalledOnce();
            expect(spyLabels).toHaveBeenCalledOnce();
        });

        it('does NOT call _drawGrids', () => {
            const spyGrids = vi.spyOn(cs, '_drawGrids');
            cs.drawWithoutGrid();
            expect(spyGrids).not.toHaveBeenCalled();
        });
    });

    // ── clearCanvas ───────────────────────────────────────────────────────────

    describe('clearCanvas()', () => {
        it('calls ctx.clearRect covering the full canvas area', () => {
            cs.clearCanvas();
            expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        });
    });

    // ── drawCube ──────────────────────────────────────────────────────────────

    describe('drawCube()', () => {
        const CUBE_START_X      = 2;
        const CUBE_START_Y      = 3;
        const CUBE_ARG_SIZE     = 5;    // size argument passed to drawCube — ignored internally
        const STORED_CUBE_SIZE  = 1;    // drawCube() always saves size as 1, ignoring the argument
        const CUBE_STROKE_COLOR = 'blue';

        it('stores _cubeProps with the given startX and startY', () => {
            cs.drawCube(CUBE_START_X, CUBE_START_Y);
            expect(cs._cubeProps.startX).toBe(CUBE_START_X);
            expect(cs._cubeProps.startY).toBe(CUBE_START_Y);
        });

        it('always stores size as 1 in _cubeProps regardless of the size argument', () => {
            cs.drawCube(0, 0, CUBE_ARG_SIZE);
            expect(cs._cubeProps.size).toBe(STORED_CUBE_SIZE);
        });

        it('calls ctx.stroke() to draw the cube outline', () => {
            cs.drawCube(0, 0);
            expect(ctx.stroke).toHaveBeenCalled();
        });

        it('sets strokeStyle to blue', () => {
            cs.drawCube(0, 0);
            expect(ctx.strokeStyle).toBe(CUBE_STROKE_COLOR);
        });

        it('draws at the correct canvas position for origin coordinates (0,0)', () => {
            cs.drawCube(0, 0);
            // First moveTo should be at the canvas origin (centre of canvas)
            expect(ctx.moveTo).toHaveBeenCalledWith(cs._origin.X, cs._origin.Y);
        });

        it('draws at the correct canvas position for positive coordinates', () => {
            const startX = CUBE_START_X;
            const startY = CUBE_START_Y;
            cs.drawCube(startX, startY);
            const expectedX = cs._origin.X + startX * DEFAULT_SCALE;
            const expectedY = cs._origin.Y - startY * DEFAULT_SCALE;
            expect(ctx.moveTo).toHaveBeenCalledWith(expectedX, expectedY);
        });
    });

    // ── scaleCube ─────────────────────────────────────────────────────────────

    describe('scaleCube()', () => {
        const SCALE_START_X             = 1;
        const SCALE_START_Y             = 2;
        const MULTIPLIER_VALID          = 2;   // a positive multiplier
        const MULTIPLIER_TRIPLE         = 3;   // multiplier used in the size assertion
        const EXPECTED_SIZE_AFTER_SCALE = 3;   // STORED_CUBE_SIZE (1) × MULTIPLIER_TRIPLE (3)
        const ZERO_MULTIPLIER           = 0;   // invalid: must be > 0
        const NEGATIVE_MULTIPLIER       = -1;  // invalid: must be > 0
        const LARGE_NEGATIVE_MULTIPLIER = -5;  // another invalid multiplier

        beforeEach(() => {
            cs.drawCube(SCALE_START_X, SCALE_START_Y); // put _cubeProps into a known state
            ctx.clearRect.mockClear();
            ctx.stroke.mockClear();
        });

        it('calls clearCanvas, draw, and drawCube when multiplier > 0', () => {
            const spyClear    = vi.spyOn(cs, 'clearCanvas');
            const spyDraw     = vi.spyOn(cs, 'draw');
            const spyDrawCube = vi.spyOn(cs, 'drawCube');

            cs.scaleCube(MULTIPLIER_VALID);

            expect(spyClear).toHaveBeenCalledOnce();
            expect(spyDraw).toHaveBeenCalledOnce();
            expect(spyDrawCube).toHaveBeenCalledOnce();
        });

        it('scales the cube by the given multiplier (stored size is always 1)', () => {
            const spyDrawCube = vi.spyOn(cs, 'drawCube');
            cs.scaleCube(MULTIPLIER_TRIPLE);
            // _cubeProps.size is always 1 (set by drawCube), so newSize = 1 × MULTIPLIER_TRIPLE = 3
            expect(spyDrawCube).toHaveBeenCalledWith(SCALE_START_X, SCALE_START_Y, EXPECTED_SIZE_AFTER_SCALE);
        });

        it('preserves the original startX and startY when scaling', () => {
            const spyDrawCube = vi.spyOn(cs, 'drawCube');
            cs.scaleCube(MULTIPLIER_VALID);
            const [calledX, calledY] = spyDrawCube.mock.calls[0];
            expect(calledX).toBe(SCALE_START_X);
            expect(calledY).toBe(SCALE_START_Y);
        });

        it('does not draw when multiplier is 0', () => {
            const spyClear = vi.spyOn(cs, 'clearCanvas');
            const spy      = vi.spyOn(console, 'error').mockImplementation(() => {});
            cs.scaleCube(ZERO_MULTIPLIER);
            expect(spyClear).not.toHaveBeenCalled();
            spy.mockRestore();
        });

        it('does not draw when multiplier is negative', () => {
            const spyClear = vi.spyOn(cs, 'clearCanvas');
            const spy      = vi.spyOn(console, 'error').mockImplementation(() => {});
            cs.scaleCube(NEGATIVE_MULTIPLIER);
            expect(spyClear).not.toHaveBeenCalled();
            spy.mockRestore();
        });

        it('logs an error when multiplier is not positive', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            cs.scaleCube(LARGE_NEGATIVE_MULTIPLIER);
            expect(spy).toHaveBeenCalledWith(
                'Multiplier must be greater than 0 and cube must be drawn first'
            );
            spy.mockRestore();
        });

        it('logs an error when no cube has been drawn yet', () => {
            const fresh = new CoordinateSystem({ canvasElement: makeCanvasMock().canvas });
            const spy   = vi.spyOn(console, 'error').mockImplementation(() => {});
            fresh.scaleCube(MULTIPLIER_VALID);
            expect(spy).toHaveBeenCalledWith(
                'Multiplier must be greater than 0 and cube must be drawn first'
            );
            spy.mockRestore();
        });
    });

    // ── _drawGrids (internal) ─────────────────────────────────────────────────

    describe('_drawGrids()', () => {
        const GRID_STROKE_COLOR = '#ddd';

        it('draws the expected number of vertical and horizontal lines', () => {
            cs._drawGrids();
            // Each line: beginPath + moveTo + lineTo + stroke = 4 calls per line
            // Lines: (numLinesX + 1) vertical + (numLinesY + 1) horizontal
            const expectedLines = (cs._numLinesX + 1) + (cs._numLinesY + 1);
            expect(ctx.beginPath).toHaveBeenCalledTimes(expectedLines);
            expect(ctx.stroke).toHaveBeenCalledTimes(expectedLines);
        });

        it('uses #ddd as the stroke colour for grid lines', () => {
            cs._drawGrids();
            expect(ctx.strokeStyle).toBe(GRID_STROKE_COLOR);
        });
    });

    // ── _drawAxes (internal) ──────────────────────────────────────────────────

    describe('_drawAxes()', () => {
        const AXES_STROKE_COLOR = 'red';
        const AXES_LINE_WIDTH   = 2;
        const CANVAS_LEFT_EDGE  = 0;  // x = 0 is the left boundary of the canvas
        const CANVAS_TOP_EDGE   = 0;  // y = 0 is the top boundary of the canvas

        it('uses red as the stroke colour for axes', () => {
            cs._drawAxes();
            expect(ctx.strokeStyle).toBe(AXES_STROKE_COLOR);
        });

        it('uses line width 2 for axes', () => {
            cs._drawAxes();
            expect(ctx.lineWidth).toBe(AXES_LINE_WIDTH);
        });

        it('draws lines through the canvas centre', () => {
            cs._drawAxes();
            // The horizontal axis passes through _origin.Y
            expect(ctx.moveTo).toHaveBeenCalledWith(CANVAS_LEFT_EDGE, cs._origin.Y);
            expect(ctx.lineTo).toHaveBeenCalledWith(DEFAULT_WIDTH, cs._origin.Y);
            // The vertical axis passes through _origin.X
            expect(ctx.moveTo).toHaveBeenCalledWith(cs._origin.X, CANVAS_TOP_EDGE);
            expect(ctx.lineTo).toHaveBeenCalledWith(cs._origin.X, DEFAULT_HEIGHT);
        });
    });

    // ── _displayLabelNumbersOnAxes (internal) ─────────────────────────────────

    describe('_displayLabelNumbersOnAxes()', () => {
        it('calls fillText for every grid-line label', () => {
            cs._displayLabelNumbersOnAxes();
            // X-axis: floor(numLinesX) + 1 ticks; Y-axis: floor(numLinesY) + 1 ticks
            const xTicks = Math.floor(cs._numLinesX / 2) * 2 + 1; // from -half to +half
            const yTicks = Math.floor(cs._numLinesY / 2) * 2 + 1;
            expect(ctx.fillText).toHaveBeenCalledTimes(xTicks + yTicks);
        });

        const LABEL_FONT       = '10px Arial';
        const LABEL_FILL_STYLE = '#000';        // black text

        it('sets font to "10px Arial"', () => {
            cs._displayLabelNumbersOnAxes();
            expect(ctx.font).toBe(LABEL_FONT);
        });

        it('sets fillStyle to black', () => {
            cs._displayLabelNumbersOnAxes();
            expect(ctx.fillStyle).toBe(LABEL_FILL_STYLE);
        });
    });
});
