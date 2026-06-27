import { CoordinateSystem } from '../coordinate-system/CoordinateSystem.js';

export class BouncingSquares {
    _squares = [];
    _coordSystem;
    _canvas;
    _animationFrameId;
    _handleClickBound;

    static MAX_VELOCITY = 4;
    static MAX_ROTATION_SPEED = 0.2;
    static MIN_SIZE = 10;
    static SIZE_RANGE = 20;

    constructor(canvasId) {
        this._coordSystem = new CoordinateSystem({ canvasId });
        this._canvas = document.getElementById(canvasId);
        
        if (this._canvas) {
            this._handleClickBound = this._handleClick.bind(this);
            this._canvas.addEventListener('click', this._handleClickBound);
        }
    }

    _handleClick(event) {
        const rect = this._canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.addSquare(x, y);
    }

    addSquare(x, y) {
        this._squares.push({
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
        if (!this._canvas) return;
        const animate = () => {
            if (!document.getElementById(this._canvas.id)) {
                this.stopAnimation();
                return;
            }
            this._update();
            this._draw();
            this._animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    stopAnimation() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = undefined;
        }
        if (this._canvas && this._handleClickBound) {
            this._canvas.removeEventListener('click', this._handleClickBound);
        }
    }

    _update() {
        this._updatePhysics();
        this._handleCollisions();
    }

    _updatePhysics() {
        for (let i = this._squares.length - 1; i >= 0; i--) {
            const sq = this._squares[i];
            sq.x += sq.dx;
            sq.y += sq.dy;
            sq.angle += sq.rotationSpeed;

            const halfSize = sq.size / 2;

            if (sq.x - halfSize <= 0 || sq.x + halfSize >= this._canvas.width) {
                sq.dx = -sq.dx;
                sq.x = Math.max(halfSize, Math.min(this._canvas.width - halfSize, sq.x));
            }
            if (sq.y - halfSize <= 0 || sq.y + halfSize >= this._canvas.height) {
                sq.dy = -sq.dy;
                sq.y = Math.max(halfSize, Math.min(this._canvas.height - halfSize, sq.y));
            }
        }
    }

    _handleCollisions() {
        const toRemove = new Set();
        for (let i = 0; i < this._squares.length; i++) {
            if (toRemove.has(i)) continue;
            for (let j = i + 1; j < this._squares.length; j++) {
                if (toRemove.has(j)) continue;
                const dx = this._squares[i].x - this._squares[j].x;
                const dy = this._squares[i].y - this._squares[j].y;
                const distSq = dx * dx + dy * dy;
                const radiusSum = this._squares[i].size / 2 + this._squares[j].size / 2;
                if (distSq < radiusSum * radiusSum) {
                    toRemove.add(i);
                    toRemove.add(j);
                }
            }
        }

        if (toRemove.size > 0) {
            const indices = Array.from(toRemove).sort((a, b) => b - a);
            for (const idx of indices) {
                this._squares.splice(idx, 1);
            }
        }
    }

    _draw() {
        this._coordSystem.clearCanvas();
        this._coordSystem.draw();

        const ctx = this._coordSystem.ctx;
        for (const sq of this._squares) {
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
        return this._squares;
    }
}
