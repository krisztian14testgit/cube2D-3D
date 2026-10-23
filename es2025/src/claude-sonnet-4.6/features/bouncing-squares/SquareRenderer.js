"use strict";

/**
 * SquareRenderer — Single Responsibility: drawing one square on a canvas context.
 * Uses ctx.save / translate / rotate / strokeRect / restore so each square
 * is drawn independently without affecting the global transform.
 */
export class SquareRenderer {
    /**
     * @param {string} [strokeStyle='blue'] - Outline colour
     * @param {number} [lineWidth=2]        - Outline width in pixels
     */
    constructor(strokeStyle = 'blue', lineWidth = 2) {
        this.strokeStyle = strokeStyle;
        this.lineWidth = lineWidth;
    }

    /**
     * Draw a single rotating square centred at (square.x, square.y).
     * @param {CanvasRenderingContext2D} ctx
     * @param {import('./SquareModel.js').SquareModel} square
     */
    draw(ctx, square) {
        const half = square.size / 2;
        ctx.save();
        ctx.translate(square.x, square.y);
        ctx.rotate(square.angle);
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.strokeRect(-half, -half, square.size, square.size);
        ctx.restore();
    }
}
