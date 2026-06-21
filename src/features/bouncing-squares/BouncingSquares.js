import { CoordinateSystem } from '../coordinate-system/CoordinateSystem.js';

export class BouncingSquares {
    #squares = [];
    #coordSystem;
    #canvas;
    #animationFrameId;
    #handleClickBound;

    static MAX_VELOCITY = 4;
    static MAX_ROTATION_SPEED = 0.2;
    static MIN_SIZE = 10;
    static SIZE_RANGE = 20;

    constructor(canvasId) {
        this.#coordSystem = new CoordinateSystem({ canvasId });
        this.#canvas = document.getElementById(canvasId);
        
        if (this.#canvas) {
            this.#handleClickBound = this.#handleClick.bind(this);
            this.#canvas.addEventListener('click', this.#handleClickBound);
        }
    }

    #handleClick(event) {
        const rect = this.#canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.addSquare(x, y);
    }

    addSquare(x, y) {
        this.#squares.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 2 * BouncingSquares.MAX_VELOCITY,
            dy: (Math.random() - 0.5) * 2 * BouncingSquares.MAX_VELOCITY,
            size: Math.random() * BouncingSquares.SIZE_RANGE + BouncingSquares.MIN_SIZE,
            angle: 0,
            rotationSpeed: (Math.random() - 0.5) * BouncingSquares.MAX_ROTATION_SPEED
        });
    }

    startAnimation() {
        if (!this.#canvas) return;
        const animate = () => {
            if (!document.getElementById(this.#canvas.id)) {
                this.stopAnimation();
                return;
            }
            this.#update();
            this.#draw();
            this.#animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    stopAnimation() {
        if (this.#animationFrameId) {
            cancelAnimationFrame(this.#animationFrameId);
            this.#animationFrameId = undefined;
        }
        if (this.#canvas && this.#handleClickBound) {
            this.#canvas.removeEventListener('click', this.#handleClickBound);
        }
    }

    #update() {
        this.#updatePhysics();
        this.#handleCollisions();
    }

    #updatePhysics() {
        for (let i = this.#squares.length - 1; i >= 0; i--) {
            const sq = this.#squares[i];
            sq.x += sq.dx;
            sq.y += sq.dy;
            sq.angle += sq.rotationSpeed;

            const halfSize = sq.size / 2;

            if (sq.x - halfSize <= 0 || sq.x + halfSize >= this.#canvas.width) {
                sq.dx = -sq.dx;
                sq.x = Math.max(halfSize, Math.min(this.#canvas.width - halfSize, sq.x));
            }
            if (sq.y - halfSize <= 0 || sq.y + halfSize >= this.#canvas.height) {
                sq.dy = -sq.dy;
                sq.y = Math.max(halfSize, Math.min(this.#canvas.height - halfSize, sq.y));
            }
        }
    }

    #handleCollisions() {
        const toRemove = new Set();
        for (let i = 0; i < this.#squares.length; i++) {
            if (toRemove.has(i)) continue;
            for (let j = i + 1; j < this.#squares.length; j++) {
                if (toRemove.has(j)) continue;
                const dx = this.#squares[i].x - this.#squares[j].x;
                const dy = this.#squares[i].y - this.#squares[j].y;
                const distSq = dx * dx + dy * dy;
                const radiusSum = this.#squares[i].size / 2 + this.#squares[j].size / 2;
                if (distSq < radiusSum * radiusSum) {
                    toRemove.add(i);
                    toRemove.add(j);
                }
            }
        }

        if (toRemove.size > 0) {
            const indices = Array.from(toRemove).sort((a, b) => b - a);
            for (const idx of indices) {
                this.#squares.splice(idx, 1);
            }
        }
    }

    #draw() {
        this.#coordSystem.clearCanvas();
        this.#coordSystem.draw();

        const ctx = this.#coordSystem.ctx;
        for (const sq of this.#squares) {
            ctx.save();
            ctx.translate(sq.x, sq.y);
            ctx.rotate(sq.angle);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.strokeRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
            ctx.restore();
        }
    }

    get squares() {
        return this.#squares;
    }
}
