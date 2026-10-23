"use strict";

/**
 * PhysicsEngine — Single Responsibility: boundary bouncing and collision detection.
 * Operates on SquareModel instances; has no drawing or UI concerns.
 */
export class PhysicsEngine {
    /**
     * Invert the velocity of a square when it would move outside the canvas boundaries.
     * @param {import('./SquareModel.js').SquareModel} square
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    bounce(square, canvasWidth, canvasHeight) {
        const r = square.radius;

        if (square.x - r <= 0 || square.x + r >= canvasWidth) {
            square.dx = -square.dx;
            // Clamp to avoid getting stuck outside the boundary
            square.x = Math.max(r, Math.min(canvasWidth - r, square.x));
        }

        if (square.y - r <= 0 || square.y + r >= canvasHeight) {
            square.dy = -square.dy;
            square.y = Math.max(r, Math.min(canvasHeight - r, square.y));
        }
    }

    /**
     * Return true when two squares overlap (circle-approximation using their radii).
     * @param {import('./SquareModel.js').SquareModel} a
     * @param {import('./SquareModel.js').SquareModel} b
     * @returns {boolean}
     */
    areColliding(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < a.radius + b.radius;
    }

    /**
     * Filter out all squares that are colliding with at least one other square.
     * @param {import('./SquareModel.js').SquareModel[]} squares
     * @returns {import('./SquareModel.js').SquareModel[]} surviving squares
     */
    removeColliding(squares) {
        const toRemove = new Set();
        for (let i = 0; i < squares.length; i++) {
            for (let j = i + 1; j < squares.length; j++) {
                if (this.areColliding(squares[i], squares[j])) {
                    toRemove.add(i);
                    toRemove.add(j);
                }
            }
        }
        return squares.filter((_, index) => !toRemove.has(index));
    }
}
