import { CoordinateSystem } from '../features/coordinate-system/CoordinateSystem.js';

export function renderMenu2(container) {
    container.innerHTML = `
        <h2>Menu 2 - Basic Coordinate System</h2>
        <div class="canvas-container">
            <canvas id="canvas-menu2"></canvas>
            <div class="manipulations">
                <label>
                    <input id="hide-grid-2" type="checkbox"/>
                    Hide grid
                </label>
                <fieldset>
                <legend>Rectangle:</legend>
                <div>
                    Scaler
                    <div class="slidecontainer">
                        <input id="my-slider-2" class="slider" type="range" min="1" max="5" value="1">
                    </div>
                </div>
                </fieldset>
            </div>
        </div>
        <hr>
        <h2>Step 2 - Bouncing & Rotating Squares</h2>
        <div class="canvas-container">
            <canvas id="canvas-menu2-step2"></canvas>
        </div>
    `;

    const coordSystem = new CoordinateSystem({ canvasId: 'canvas-menu2' });
    const CUBE_SCALE = 1;
    coordSystem.draw();
    coordSystem.drawCube(10, 10, CUBE_SCALE);

    const hideCheckbox = document.getElementById('hide-grid-2');
    if (hideCheckbox) {
        hideCheckbox.addEventListener('change', (event) => {
            coordSystem.clearCanvas();
            if (event.target.checked) {
                coordSystem.drawWithoutGrid();
            } else {
                coordSystem.draw();
            }
            const slider = document.getElementById('my-slider-2');
            const multiplier = slider ? Number(slider.value) : 1;
            coordSystem.drawCube(10, 10, CUBE_SCALE * multiplier);
        });
    }

    const slider = document.getElementById('my-slider-2');
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

    // Step 2 implementation
    const coordSystem2 = new CoordinateSystem({ canvasId: 'canvas-menu2-step2' });
    const squares = [];
    const canvas2 = document.getElementById('canvas-menu2-step2');

    if (canvas2) {
        canvas2.addEventListener('click', (event) => {
            const rect = canvas2.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            squares.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 4,
                dy: (Math.random() - 0.5) * 4,
                size: Math.random() * 20 + 10,
                angle: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        });

        let animationFrameId;
        function animate() {
            if (!document.getElementById('canvas-menu2-step2')) {
                cancelAnimationFrame(animationFrameId);
                return;
            }

            coordSystem2.clearCanvas();
            coordSystem2.draw();

            // Update physics and boundaries
            for (let i = squares.length - 1; i >= 0; i--) {
                let sq = squares[i];
                sq.x += sq.dx;
                sq.y += sq.dy;
                sq.angle += sq.rotationSpeed;

                const halfSize = sq.size / 2;

                if (sq.x - halfSize <= 0 || sq.x + halfSize >= canvas2.width) {
                    sq.dx = -sq.dx;
                    sq.x = Math.max(halfSize, Math.min(canvas2.width - halfSize, sq.x));
                }
                if (sq.y - halfSize <= 0 || sq.y + halfSize >= canvas2.height) {
                    sq.dy = -sq.dy;
                    sq.y = Math.max(halfSize, Math.min(canvas2.height - halfSize, sq.y));
                }
            }

            // Collisions
            const toRemove = new Set();
            for (let i = 0; i < squares.length; i++) {
                if (toRemove.has(i)) continue;
                for (let j = i + 1; j < squares.length; j++) {
                    if (toRemove.has(j)) continue;
                    const dx = squares[i].x - squares[j].x;
                    const dy = squares[i].y - squares[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < (squares[i].size / 2 + squares[j].size / 2)) {
                        toRemove.add(i);
                        toRemove.add(j);
                    }
                }
            }

            if (toRemove.size > 0) {
                const indices = Array.from(toRemove).sort((a, b) => b - a);
                for (let idx of indices) {
                    squares.splice(idx, 1);
                }
            }

            // Drawing
            const ctx = coordSystem2.ctx;
            for (let sq of squares) {
                ctx.save();
                ctx.translate(sq.x, sq.y);
                ctx.rotate(sq.angle);
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.strokeRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        animate();
    }
}
