import { CoordinateSystem } from '../features/coordinate-system/CoordinateSystem.js';

export function renderMenu1(container) {
    container.innerHTML = `
        <h2>Menu 1 - Coordinate System</h2>
        <h3>Step 1 - Basic Coordinate System</h3>
        <div class="canvas-container">
            <canvas id="canvas-menu1"></canvas>
            <div class="manipulations">
                <label>
                    <input id="hide-grid-1" type="checkbox"/>
                    Hide grid
                </label>
                <fieldset>
                <legend>Rectangle:</legend>
                <div>
                    Scaler
                    <div class="slidecontainer">
                        <input id="my-slider-1" class="slider" type="range" min="1" max="5" value="1">
                    </div>
                </div>
                </fieldset>
            </div>
        </div>
        <hr>
        <h3>Step 2 - Bouncing & Rotating Squares</h3>
        <div class="canvas-container">
            <canvas id="canvas-menu2"></canvas>
        </div>
    `;

    const coordSystem = new CoordinateSystem({ canvasId: 'canvas-menu1' });
    const CUBE_SCALE = 1;
    coordSystem.draw();
    coordSystem.drawCube(10, 10, CUBE_SCALE);

    const hideCheckbox = document.getElementById('hide-grid-1');
    if (hideCheckbox) {
        hideCheckbox.addEventListener('change', (event) => {
            coordSystem.clearCanvas();
            if (event.target.checked) {
                coordSystem.drawWithoutGrid();
            } else {
                coordSystem.draw();
            }
            const slider = document.getElementById('my-slider-1');
            const multiplier = slider ? Number(slider.value) : 1;
            coordSystem.drawCube(10, 10, CUBE_SCALE * multiplier);
        });
    }

    const slider = document.getElementById('my-slider-1');
    if (slider) {
        slider.addEventListener('change', (event) => {
            const multiplier = Number(event.target.value);
            coordSystem.clearCanvas();
            if (hideCheckbox && hideCheckbox.checked) {
                coordSystem.drawWithoutGrid();
            } else {
                coordSystem.draw();
            }
            coordSystem.drawCube(10, 10, CUBE_SCALE * multiplier);
        });
    }

    const animatedCoordSystem = new CoordinateSystem({ canvasId: 'canvas-menu2' });
    const animatedCanvas = document.getElementById('canvas-menu2');
    const squares = [];
    const minSize = 14;
    const maxSize = 36;
    let animationFrameId = null;

    const randomDirection = () => (Math.random() < 0.5 ? -1 : 1);
    const randomBetween = (min, max) => min + Math.random() * (max - min);

    const createSquare = (x, y) => ({
        x,
        y,
        dx: randomDirection() * randomBetween(1.2, 2.4),
        dy: randomDirection() * randomBetween(1.2, 2.4),
        size: randomBetween(minSize, maxSize),
        angle: 0,
        rotationSpeed: randomDirection() * randomBetween(0.01, 0.06)
    });

    if (animatedCanvas) {
        animatedCanvas.addEventListener('click', (event) => {
            const rect = animatedCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            squares.push(createSquare(x, y));
        });
    }

    const resolveBoundaryCollision = (square) => {
        const halfSize = square.size / 2;
        const canvasWidth = animatedCanvas.width;
        const canvasHeight = animatedCanvas.height;
        const maxX = canvasWidth - halfSize;
        const maxY = canvasHeight - halfSize;

        if (square.x - halfSize <= 0 || square.x + halfSize >= canvasWidth) {
            square.dx *= -1;
            square.x = Math.max(halfSize, Math.min(maxX, square.x));
        }

        if (square.y - halfSize <= 0 || square.y + halfSize >= canvasHeight) {
            square.dy *= -1;
            square.y = Math.max(halfSize, Math.min(maxY, square.y));
        }
    };

    const removeCollidingSquares = () => {
        const toRemove = new Set();

        for (let i = 0; i < squares.length; i++) {
            for (let j = i + 1; j < squares.length; j++) {
                const dx = squares[i].x - squares[j].x;
                const dy = squares[i].y - squares[j].y;
                const distance = Math.hypot(dx, dy);
                const minDistance = (squares[i].size + squares[j].size) / 2;

                if (distance <= minDistance) {
                    toRemove.add(i);
                    toRemove.add(j);
                }
            }
        }

        [...toRemove]
            .sort((a, b) => b - a)
            .forEach((index) => {
                squares.splice(index, 1);
            });
    };

    const drawRotatedSquare = (square) => {
        const { ctx } = animatedCoordSystem;
        ctx.save();
        ctx.translate(square.x, square.y);
        ctx.rotate(square.angle);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(-square.size / 2, -square.size / 2, square.size, square.size);
        ctx.restore();
    };

    const animate = () => {
        if (!animatedCanvas || !animatedCanvas.isConnected) {
            return;
        }

        animatedCoordSystem.clearCanvas();
        animatedCoordSystem.draw();

        squares.forEach((square) => {
            square.x += square.dx;
            square.y += square.dy;
            square.angle += square.rotationSpeed;
            resolveBoundaryCollision(square);
        });

        removeCollidingSquares();
        squares.forEach(drawRotatedSquare);

        animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }
    };
}
