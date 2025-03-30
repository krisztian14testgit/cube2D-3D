"use strict";

class CoordinateSystem {
	// Set the scale of the grid (distance between points)
	scale = 9.5;
	
	// private property with #
	// private property is not part of prototype, not inheritance private fields for sub-classes
	// * structureClone() => not clone private properties
	// * not declared in constructor
	#defaultProp = { 
		width: 513,
		height: 513,
		contextType: '2d'
	};
	
	_cubeProps = null;
	
	constructor(params = {}) {
		this.defaultProp = {...this.defaultProp, ...params};
		// Initialize the canvas and context
		this._canvas = document.getElementById('myCanvas');
		this._canvas.width = this.#defaultProp.width;
		this._canvas.height = this.#defaultProp.height;
		this.ctx = this._canvas.getContext(this.#defaultProp.contextType);
		// Calculate the number of vertical and horizontal lines needed
		this._numLinesX = Math.floor(this._canvas.width / this.scale);
		this._numLinesY = Math.floor(this._canvas.height / this.scale);
		// Calculate the origin in the middle of the canvas
		this._origin = {
			X: Math.floor(this._canvas.width / 2),
			Y: Math.floor(this._canvas.height / 2)
		};
		
	}
	
	// not be clocned or inheritanced
	#printNameTest() {
		console.log(this._canvas.id);
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
		// Draw vertical lines
		for (let i = 0; i <= this._numLinesX; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo(i * this.scale, 0); // Move to the top of the canvas
			this.ctx.lineTo(i * this.scale, this._canvas.height); // Draw down to the bottom of the canvas
			this.ctx.strokeStyle = '#ddd'; // Light gray color for grid lines
			this.ctx.lineWidth = 1;
			this.ctx.stroke();
		}

		// Draw horizontal lines
		for (let j = 0; j <= this._numLinesY; j++) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, j * this.scale); // Move to the left side of the canvas
			this.ctx.lineTo(this._canvas.width, j * this.scale); // Draw across to the right side of the canvas
			this.ctx.strokeStyle = '#ddd'; // Light gray color for grid lines
			this.ctx.lineWidth = 1;
			this.ctx.stroke();
		}
	}
	
	_drawAxes() {
		// Draw x and y axes (darker lines)
		this.ctx.beginPath();
		this.ctx.moveTo(0, this._origin.Y); // Y-axis from the left to the right of the canvas
		this.ctx.lineTo(this._canvas.width, this._origin.Y); // X-axis along the bottom of the canvas
		this.ctx.moveTo(this._origin.X, 0); // X-axis from top to bottom
		this.ctx.lineTo(this._origin.X, this._canvas.height); // Y-axis along the left of the canvas
		this.ctx.strokeStyle = 'red'; // red color for axes
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
	
	drawCube(startX, startY, size = 1) {
		 // Store the initial cube properties for later scaling
        this._cubeProps = { startX, startY, size: 1 };
		
        // Convert the start coordinates to canvas coordinates
        const startXCanvas = this._origin.X + startX * this.scale;
        const startYCanvas = this._origin.Y - startY * this.scale;

        // Define the vertices of the cube
        const vertices = [
            { x: startXCanvas, y: startYCanvas },
            { x: startXCanvas + size * this.scale, y: startYCanvas },
            { x: startXCanvas + size * this.scale, y: startYCanvas - size * this.scale },
            { x: startXCanvas, y: startYCanvas - size * this.scale },
            { x: startXCanvas, y: startYCanvas + size * this.scale },
            { x: startXCanvas + size * this.scale, y: startYCanvas + size * this.scale },
            { x: startXCanvas + size * this.scale, y: startYCanvas },
            { x: startXCanvas, y: startYCanvas },
        ];

        // Draw the edges of the cube
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 2;

        // Draw the front face (starting from bottom left)
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        this.ctx.lineTo(vertices[1].x, vertices[1].y);
        this.ctx.lineTo(vertices[2].x, vertices[2].y);
        this.ctx.lineTo(vertices[3].x, vertices[3].y);
        this.ctx.lineTo(vertices[0].x, vertices[0].y);
        this.ctx.stroke();

        // Draw the back face (shifted up and to the right by 'size' units)
		/*this.ctx.beginPath();
        this.ctx.moveTo(vertices[4].x, vertices[4].y);
        this.ctx.lineTo(vertices[5].x, vertices[5].y);
        this.ctx.lineTo(vertices[6].x, vertices[6].y);
        this.ctx.lineTo(vertices[7].x, vertices[7].y);
        this.ctx.lineTo(vertices[4].x, vertices[4].y);
        this.ctx.stroke();*/

        // Draw the connecting lines between the front and back faces
        /*for (let i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(vertices[i].x, vertices[i].y);
            this.ctx.lineTo(vertices[i + 4].x, vertices[i + 4].y);
            this.ctx.stroke();
        }*/
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


// ----Main------
const coordSystem = new CoordinateSystem();
//coordSystem.#printNameTest();
coordSystem.draw();
coordSystem.drawCube(10, 10, 4);



const hideCheckbox = document.getElementById('hide-grid');
hideCheckbox.onclick = function(event) {
	coordSystem.clearCanvas();
	
	if (event.target.checked) {
		coordSystem.drawWithoutGrid();
	} else {
		coordSystem.draw();
	}
}

const mySlider = document.getElementById('my-slider');
mySlider.onchange = function(event) {
	const scaler = Number(event.target.value);
	coordSystem.scaleCube(scaler); => size is always overwritten
}












