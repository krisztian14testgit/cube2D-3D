"use strict";

export class CoordinateSystem {
    // Set the scale of the grid (distance between points)
    scale = 9.5;

    #defaultProp = { 
        width: 513,
        height: 513,
        contextType: '2d',
        canvasId: 'myCanvas'
    };

    _cubeProps = null;

    constructor(params = {}) {
        const config = { ...this.#defaultProp, ...params };
        
        if (params.canvasElement) {
            this._canvas = params.canvasElement;
        } else {
            this._canvas = document.getElementById(config.canvasId);
        }
        
        if (!this._canvas) {
            throw new Error('Canvas element not found');
        }

        this._canvas.width = config.width;
        this._canvas.height = config.height;
        this.ctx = this._canvas.getContext(config.contextType);

        this._numLinesX = Math.floor(this._canvas.width / this.scale);
        this._numLinesY = Math.floor(this._canvas.height / this.scale);

        this._origin = {
            X: Math.floor(this._canvas.width / 2),
            Y: Math.floor(this._canvas.height / 2)
        };
    }

    draw() {
        this._drawGrids();
        this._drawAxes();
        this._displayLabelNumbersOnAxes();
    }

    drawWithoutGrid() {
        this._drawAxes();
        this._displayLabelNumbersOnAxes();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    _drawGrids() {
        for (let i = 0; i <= this._numLinesX; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.scale, 0);
            this.ctx.lineTo(i * this.scale, this._canvas.height);
            this.ctx.strokeStyle = '#ddd';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        for (let j = 0; j <= this._numLinesY; j++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, j * this.scale);
            this.ctx.lineTo(this._canvas.width, j * this.scale);
            this.ctx.strokeStyle = '#ddd';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    _drawAxes() {
        this.ctx.beginPath();
        this.ctx.moveTo(0, this._origin.Y);
        this.ctx.lineTo(this._canvas.width, this._origin.Y);
        this.ctx.moveTo(this._origin.X, 0);
        this.ctx.lineTo(this._origin.X, this._canvas.height);
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    _displayLabelNumbersOnAxes() {
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#000';
        for (let i = -this._numLinesX / 2; i <= this._numLinesX / 2; i++) {
            this.ctx.fillText(i, this._origin.X + i * this.scale + 2, this._origin.Y + 12);
        }
        for (let j = -this._numLinesY / 2; j <= this._numLinesY / 2; j++) {
            this.ctx.fillText(-j, this._origin.X + 2, this._origin.Y - j * this.scale - 2);
        }
    }

    drawCube(startX, startY, size = 1, angleDeg = 0) {
        // Store the initial cube properties for later scaling/rotation
        this._cubeProps = { startX, startY, size };
        
        // Convert the start coordinates to canvas coordinates
        const startXCanvas = this._origin.X + startX * this.scale;
        const startYCanvas = this._origin.Y - startY * this.scale;

        // Define the four corners of the square (top-left, top-right, bottom-right, bottom-left)
        const sideLen = size * this.scale;
        const rawVertices = [
            { x: startXCanvas,           y: startYCanvas - sideLen },
            { x: startXCanvas + sideLen, y: startYCanvas - sideLen },
            { x: startXCanvas + sideLen, y: startYCanvas },
            { x: startXCanvas,           y: startYCanvas },
        ];

        // Rotate vertices around the center of the square
        const centerX = startXCanvas + sideLen / 2;
        const centerY = startYCanvas - sideLen / 2;
        const angleRad = (angleDeg * Math.PI) / 180;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);

        const vertices = rawVertices.map(({ x, y }) => {
            const dx = x - centerX;
            const dy = y - centerY;
            return {
                x: centerX + dx * cosA - dy * sinA,
                y: centerY + dx * sinA + dy * cosA,
            };
        });

        // Draw the edges of the cube
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        this.ctx.lineTo(vertices[1].x, vertices[1].y);
        this.ctx.lineTo(vertices[2].x, vertices[2].y);
        this.ctx.lineTo(vertices[3].x, vertices[3].y);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    scaleCube(multiplier) {
        if (this._cubeProps && multiplier > 0) {
            const newSize = this._cubeProps.size * multiplier;
            this.clearCanvas();
            this.draw(); // Redraw the grid and axes
            this.drawCube(this._cubeProps.startX, this._cubeProps.startY, newSize); // Draw the cube with the new size
        } else {
            console.error('Multiplier must be greater than 0 and cube must be drawn first');
        }
    }
}
