import { CUBES_EXPLODING_DEFAULTS, CubesExplodingScene } from './CubesExplodingScene.js';

export function createCubesExplodingMarkup() {
    return `
        <div style="display: flex; flex-direction: column; width: 100%; height: 100%; overflow-y: auto; padding-bottom: 20px;">
            <h2 style="padding: 10px 20px; margin: 0;">GPT-5.3-Codex - 3D Cubes</h2>
            <p style="padding: 0 20px; margin-top: 0;">BabylonJS sphere boundary with exploding cubes interaction.</p>

            <hr style="border: 1px solid #ccc; width: 100%;" />

            <h2 style="padding: 10px 20px; margin: 0;">Exploding Cubes in Sphere Boundary</h2>
            <div id="gpt-cubes-exploding-container" style="display: flex; min-height: 500px; border: 1px solid #ccc; width: 100%;">
                <div style="width: 300px; padding: 20px; background: #f5f5f5; border-right: 1px solid #ddd; overflow-y: auto;">
                    <h3>Control Panel</h3>
                    <div class="control-group" style="margin-bottom: 15px;">
                        <label for="gpt-cubes-sphere-scale">Sphere Scale</label><br/>
                        <input type="range" id="gpt-cubes-sphere-scale" min="2" max="20" step="1" value="${CUBES_EXPLODING_DEFAULTS.sphereScale}" style="width: 100%">
                        <span id="gpt-cubes-sphere-scale-val">${CUBES_EXPLODING_DEFAULTS.sphereScale}</span>
                    </div>
                    <div class="control-group" style="margin-bottom: 15px;">
                        <label for="gpt-cubes-max-cubes">Max Cubes (${CUBES_EXPLODING_DEFAULTS.minMaxCubes} - ${CUBES_EXPLODING_DEFAULTS.maxMaxCubes})</label><br/>
                        <input type="number" id="gpt-cubes-max-cubes" min="${CUBES_EXPLODING_DEFAULTS.minMaxCubes}" max="${CUBES_EXPLODING_DEFAULTS.maxMaxCubes}" value="${CUBES_EXPLODING_DEFAULTS.maxCubes}" style="width: 100%">
                    </div>
                    <div class="control-group" style="margin-bottom: 15px;">
                        <small>Left click inside sphere to spawn a cube (random scale 1-5).</small><br/>
                        <small>Right click + drag to rotate camera, mouse wheel to zoom.</small>
                    </div>
                </div>
                <div style="flex-grow: 1; position: relative; min-height: 500px;">
                    <canvas id="gpt-cubes-render-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
                </div>
            </div>
        </div>
    `;
}

export function renderCubesExplodingMenuPage(container) {
    container.innerHTML = createCubesExplodingMarkup();
    const canvas = container.querySelector('#gpt-cubes-render-canvas');
    if (!canvas) {
        return null;
    }

    const scene = new CubesExplodingScene(canvas);
    scene.initialize();
    scene.bindControls(container);
    return scene;
}
