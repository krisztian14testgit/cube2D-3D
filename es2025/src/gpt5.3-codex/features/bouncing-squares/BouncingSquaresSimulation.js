import { CoordinateSystem } from '../CoordinateSystem.js';

const DEFAULTS = Object.freeze({
    minSize: 14,
    maxSize: 36,
    maxSquares: 80,
    minVelocity: 1.2,
    maxVelocity: 2.4,
    minRotationSpeed: 0.01,
    maxRotationSpeed: 0.06
});

const randomDirection = () => (Math.random() < 0.5 ? -1 : 1);
const randomBetween = (min, max) => min + Math.random() * (max - min);

export class BouncingSquaresSimulation {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.config = { ...DEFAULTS, ...config };
        this.squares = [];
        this.animationFrameId = null;
        this.coordSystem = new CoordinateSystem({ canvasElement: canvas });
    }

    start() {
        if (!this.canvas) {
            return;
        }

        this.canvas.addEventListener('click', this.#handleCanvasClick);
        this.#animate();
    }

    stop() {
        if (!this.canvas) {
            return;
        }

        this.canvas.removeEventListener('click', this.#handleCanvasClick);
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    #handleCanvasClick = (event) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.squares.length >= this.config.maxSquares) {
            this.squares.shift();
        }

        this.squares.push(this.#createSquare(x, y));
    };

    #createSquare(x, y) {
        return {
            x,
            y,
            dx: randomDirection() * randomBetween(this.config.minVelocity, this.config.maxVelocity),
            dy: randomDirection() * randomBetween(this.config.minVelocity, this.config.maxVelocity),
            size: randomBetween(this.config.minSize, this.config.maxSize),
            angle: 0,
            rotationSpeed: randomDirection() * randomBetween(
                this.config.minRotationSpeed,
                this.config.maxRotationSpeed
            )
        };
    }

    #resolveBoundaryCollision(square) {
        const halfSize = square.size / 2;
        const maxX = this.canvas.width - halfSize;
        const maxY = this.canvas.height - halfSize;

        if (square.x - halfSize < 0 || square.x + halfSize > this.canvas.width) {
            square.dx *= -1;
            square.x = Math.max(halfSize, Math.min(maxX, square.x));
        }

        if (square.y - halfSize < 0 || square.y + halfSize > this.canvas.height) {
            square.dy *= -1;
            square.y = Math.max(halfSize, Math.min(maxY, square.y));
        }
    }

    #removeCollidingSquares() {
        const toRemove = new Set();

        for (let i = 0; i < this.squares.length; i += 1) {
            for (let j = i + 1; j < this.squares.length; j += 1) {
                const dx = this.squares[i].x - this.squares[j].x;
                const dy = this.squares[i].y - this.squares[j].y;
                const distance = Math.hypot(dx, dy);
                const minDistance = (this.squares[i].size + this.squares[j].size) / 2;

                if (distance <= minDistance) {
                    toRemove.add(i);
                    toRemove.add(j);
                }
            }
        }

        [...toRemove]
            .sort((a, b) => b - a)
            .forEach((index) => {
                this.squares.splice(index, 1);
            });
    }

    #drawRotatedSquare(square) {
        const { ctx } = this.coordSystem;
        ctx.save();
        ctx.translate(square.x, square.y);
        ctx.rotate(square.angle);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(-square.size / 2, -square.size / 2, square.size, square.size);
        ctx.restore();
    }

    #animate = () => {
        if (!this.canvas?.isConnected) {
            this.stop();
            return;
        }

        this.coordSystem.clearCanvas();
        this.coordSystem.draw();

        this.squares.forEach((square) => {
            square.x += square.dx;
            square.y += square.dy;
            square.angle += square.rotationSpeed;
            this.#resolveBoundaryCollision(square);
        });

        this.#removeCollidingSquares();
        this.squares.forEach((square) => this.#drawRotatedSquare(square));
        this.animationFrameId = requestAnimationFrame(this.#animate);
    };
}
