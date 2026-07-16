export function renderThreejsCubePage(container) {
    container.innerHTML = `
        <div id="threejs-cube-container" style="display: flex; height: 100%; border: 1px solid #ccc; width: 100%;">
            <div id="controls-panel" style="width: 300px; padding: 20px; background: #f5f5f5; border-right: 1px solid #ddd; overflow-y: auto;">
                <h3>Cube Controls</h3>
                
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
}
