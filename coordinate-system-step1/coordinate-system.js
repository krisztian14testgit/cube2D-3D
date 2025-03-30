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
		this.clearCanvas();
		this._drawGrids();
		this._drawAxes();
		this._displayLabelNumbersOnAxes();
	}
	
	drawWithoutGrid() {
		this.clearCanvas();
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
}


// ----Main------
const coordSystem = new CoordinateSystem();
//coordSystem.#printNameTest();
coordSystem.draw();

const hideCheckbox = document.getElementById('hide-grid');
hideCheckbox.onclick = function(event) {
	if (event.target.checked) {
		coordSystem.drawWithoutGrid();
	} else {
		coordSystem.draw();
	}
}












