"use strict";

/**
 * SquareModel — Single Responsibility: holds the state of one animated square.
 * All physics-independent data lives here; the PhysicsEngine mutates it.
 */
export class SquareModel {
    /**
     * @param {number} x          - Centre X in canvas pixels
     * @param {number} y          - Centre Y in canvas pixels
     * @param {number} size       - Side length in pixels
     * @param {number} dx         - Horizontal velocity (pixels/frame)
     * @param {number} dy         - Vertical velocity (pixels/frame)
     * @param {number} [angle=0]  - Initial rotation in radians
     * @param {number} rotationSpeed - Rotation delta per frame in radians
     */
    constructor({ x, y, size, dx, dy, angle = 0, rotationSpeed }) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.dx = dx;
        this.dy = dy;
        this.angle = angle;
        this.rotationSpeed = rotationSpeed;
    }

    /** Apply one frame of movement and rotation. */
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.angle += this.rotationSpeed;
    }

    /** Half-diagonal used as the collision / boundary radius. */
    get radius() {
        return (this.size * Math.SQRT2) / 2;
    }
}
