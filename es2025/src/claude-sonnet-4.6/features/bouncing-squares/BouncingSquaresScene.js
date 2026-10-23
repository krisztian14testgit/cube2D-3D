"use strict";

import { SquareModel } from './SquareModel.js';
import { PhysicsEngine } from './PhysicsEngine.js';
import { SquareRenderer } from './SquareRenderer.js';

/**
 * BouncingSquaresScene — Orchestrator (Open/Closed: depend on abstractions).
 * Manages the animation loop, square creation on click, and delegates
 * physics and rendering to their dedicated classes.
 */
export class BouncingSquaresScene {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {import('../coordinate-system/CoordinateSystem.js').CoordinateSystem} coordSystem
     * @param {PhysicsEngine} physicsEngine
     * @param {SquareRenderer} renderer
     */
    constructor(canvas, coordSystem, physicsEngine, renderer) {
        this._canvas = canvas;
        this._coordSystem = coordSystem;
        this._physicsEngine = physicsEngine;
        this._renderer = renderer;

        this._squares = [];
        this._animationId = null;
        this._bound_onFrame = this._onFrame.bind(this);
    }

    /** Attach the click listener and start the animation loop. */
    start() {
        this._canvas.addEventListener('click', this._onCanvasClick.bind(this));
        this._coordSystem.draw();
        this._animationId = requestAnimationFrame(this._bound_onFrame);
    }

    /** Cancel the running animation frame. */
    stop() {
        if (this._animationId !== null) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
    }

    /**
     * Spawn a new square at the given canvas pixel coordinates.
     * Properties (velocity, size, rotationSpeed) are randomised.
     * @param {number} x
     * @param {number} y
     */
    spawnSquare(x, y) {
        const size = Math.random() * 40 + 20;           // 20–60 px
        const speed = Math.random() * 2 + 1;            // 1–3 px/frame
        const angle = Math.random() * Math.PI * 2;      // random direction
        this._squares.push(new SquareModel({
            x,
            y,
            size,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            rotationSpeed: (Math.random() - 0.5) * 0.1, // ±0.05 rad/frame
        }));
    }

    // ── Private ────────────────────────────────────────────────────────────────

    _onCanvasClick(event) {
        const rect = this._canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.spawnSquare(x, y);
    }

    _onFrame() {
        this._update();
        this._draw();
        this._animationId = requestAnimationFrame(this._bound_onFrame);
    }

    _update() {
        const w = this._canvas.width;
        const h = this._canvas.height;

        for (const square of this._squares) {
            square.update();
            this._physicsEngine.bounce(square, w, h);
        }

        this._squares = this._physicsEngine.removeColliding(this._squares);
    }

    _draw() {
        this._coordSystem.clearCanvas();
        this._coordSystem.draw();
        for (const square of this._squares) {
            this._renderer.draw(this._coordSystem.ctx, square);
        }
    }
}
