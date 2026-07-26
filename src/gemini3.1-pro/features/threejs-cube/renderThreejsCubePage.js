export function renderThreejsCubePage(container) {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; height: 100%; overflow-y: auto; padding-bottom: 20px;">
            <h2 style="padding: 10px 20px; margin: 0;">Drawing a 3D Cube</h2>
            <div id="threejs-cube-container" style="display: flex; min-height: 500px; border: 1px solid #ccc; width: 100%; margin-bottom: 20px;">
                <div id="controls-panel" style="width: 300px; padding: 20px; background: #f5f5f5; border-right: 1px solid #ddd; overflow-y: auto;">
                    <h3>3DCube Controls with 3D coordinate system</h3>
                    
                    <div class="control-group" style="margin-bottom: 15px;">
                        <label>Scale</label><br/>
                        X: <input type="range" id="scale-x" min="0.1" max="5" step="0.1" value="1" style="width: 100%"><br/>
                        Y: <input type="range" id="scale-y" min="0.1" max="5" step="0.1" value="1" style="width: 100%"><br/>
                        Z: <input type="range" id="scale-z" min="0.1" max="5" step="0.1" value="1" style="width: 100%">
                    </div>

                    <div class="control-group" style="margin-bottom: 15px;">
                        <label>Rotation Axis</label><br/>
                        <label><input type="checkbox" id="rot-x"> X-Axis</label><br/>
                        <label><input type="checkbox" id="rot-y" checked> Y-Axis</label><br/>
                        <label><input type="checkbox" id="rot-z"> Z-Axis</label>
                    </div>

                    <div class="control-group" style="margin-bottom: 15px;">
                        <label>Rotation Speed</label><br/>
                        <input type="range" id="rot-speed" min="0" max="0.1" step="0.001" value="0.02" style="width: 100%">
                    </div>

                    <div class="control-group" style="margin-bottom: 15px;">
                        <label>Cube Color</label><br/>
                        <input type="color" id="cube-color" value="#add8e6" style="width: 100%">
                    </div>
                </div>
                <div style="flex-grow: 1; position: relative;">
                    <canvas id="renderCanvas" style="width: 100%; height: 100%; touch-action: none; display: block;"></canvas>
                </div>
            </div>

            <hr style="border: 1px solid #ccc; width: 100%;" />
            <h2 style="padding: 10px 20px; margin: 0;">Exploding Cubes</h2>
            
            <div id="cubes-exploding-container" style="display: flex; min-height: 500px; border: 1px solid #ccc; width: 100%;">
                <div id="exploding-controls-panel" style="width: 300px; padding: 20px; background: #f5f5f5; border-right: 1px solid #ddd; overflow-y: auto;">
                    <h3>Exploding 3D Cubes in a 3D Sphere</h3>
                    
                    <div class="control-group" style="margin-bottom: 15px;">
                        <label>Sphere Scale</label><br/>
                        <input type="range" id="sphere-scale" min="1" max="20" step="1" value="8" style="width: 100%">
                        <span id="sphere-scale-val">8</span>
                    </div>

                    <div class="control-group" style="margin-bottom: 15px;">
                        <label>Max Cubes (10 - 100)</label><br/>
                        <input type="number" id="max-cubes" min="10" max="100" value="10" style="width: 100%">
                    </div>
                    
                    <div class="control-group" style="margin-bottom: 15px;">
                        <small>Left click in sphere to add cubes.</small><br/>
                        <small>Right click to rotate camera.</small>
                    </div>
                </div>
                <div style="flex-grow: 1; position: relative;">
                    <canvas id="renderCanvasExploding" style="width: 100%; height: 100%; touch-action: none; display: block;"></canvas>
                </div>
            </div>
        </div>
    `;

    // Dynamic import to avoid loading threejs when not needed
    import('./ThreejsCubeScene.js').then((module) => {
        const sceneManager = new module.ThreejsCubeScene(document.getElementById('renderCanvas'));
        sceneManager.initialize();

        // Pass dependencies to controller
        import('./CubeState.js').then((stateModule) => {
             const state = new stateModule.CubeState();
             import('./CubeController.js').then((controllerModule) => {
                 const controller = new controllerModule.CubeController(sceneManager, state);
                 controller.bindControls();
             });
        });
    });

    import('../cubes-exploding/CubesExplodingScene.js').then((module) => {
        const explodingSceneManager = new module.CubesExplodingScene(document.getElementById('renderCanvasExploding'));
        explodingSceneManager.initialize();
        explodingSceneManager.bindControls();
    });
}
