import { CUBES_EXPLODING_DEFAULTS, CubesExplodingScene } from './CubesExplodingScene.js';

export function createCubesExplodingMarkup() {
    return `
        <section>
            <h3 style="padding: 10px 0; margin: 0;">Exploding Cubes in Sphere Boundary</h3>
            <p><i>Created by Grok 4.5</i></p>
            <div id="grok-cubes-exploding-container" style="display: flex; min-height: 500px; border: 1px solid #ccc; width: 100%;">
                <div style="width: 300px; padding: 20px; background: #f5f5f5; border-right: 1px solid #ddd; overflow-y: auto;">
                    <h4>Control Panel</h4>
                    <div class="control-group" style="margin-bottom: 15px;">
                        <label for="grok-cubes-sphere-scale">Sphere Scale</label><br/>
                        <input type="range" id="grok-cubes-sphere-scale" min="2" max="20" step="1" value="${CUBES_EXPLODING_DEFAULTS.sphereScale}" style="width: 100%">
                        <span id="grok-cubes-sphere-scale-val">${CUBES_EXPLODING_DEFAULTS.sphereScale}</span>
                    </div>
                    <div class="control-group" style="margin-bottom: 15px;">
                        <label for="grok-cubes-max-cubes">Max Cubes (${CUBES_EXPLODING_DEFAULTS.minMaxCubes} - ${CUBES_EXPLODING_DEFAULTS.maxMaxCubes})</label><br/>
                        <input type="number" id="grok-cubes-max-cubes" min="${CUBES_EXPLODING_DEFAULTS.minMaxCubes}" max="${CUBES_EXPLODING_DEFAULTS.maxMaxCubes}" value="${CUBES_EXPLODING_DEFAULTS.maxCubes}" style="width: 100%">
                    </div>
                    <div class="control-group" style="margin-bottom: 15px;">
                        <label for="grok-cubes-camera-rotation-speed">Camera Rotation Speed</label><br/>
                        <input type="range" id="grok-cubes-camera-rotation-speed" min="${CUBES_EXPLODING_DEFAULTS.minCameraRotationSpeed}" max="${CUBES_EXPLODING_DEFAULTS.maxCameraRotationSpeed}" step="0.1" value="${CUBES_EXPLODING_DEFAULTS.cameraRotationSpeed}" style="width: 100%">
                        <span id="grok-cubes-camera-rotation-speed-val">${CUBES_EXPLODING_DEFAULTS.cameraRotationSpeed.toFixed(1)}</span>
                    </div>
                    <div class="control-group" style="margin-bottom: 15px;">
                        <small>Left click inside sphere to spawn a cube (random scale 1-5).</small><br/>
                        <small>Right click + drag to rotate camera, mouse wheel to zoom.</small>
                    </div>
                </div>
                <div style="flex-grow: 1; position: relative; min-height: 500px;">
                    <canvas id="grok-cubes-render-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
                </div>
            </div>
        </section>
    `;
}

export function renderCubesExplodingMenuPage(container) {
    container.innerHTML = createCubesExplodingMarkup();
    const canvas = container.querySelector('#grok-cubes-render-canvas');
    if (!canvas) {
        return null;
    }

    const scene = new CubesExplodingScene(canvas);
    scene.initialize();
    scene.bindControls(container);
    return scene;
}
