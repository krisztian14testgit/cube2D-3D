export class CubeController {
    constructor(sceneManager, state) {
        this.sceneManager = sceneManager;
        this.state = state;

        // Register to render loop to apply rotation continuously
        this.sceneManager.registerRenderLoopCallback(() => {
            this.sceneManager.applyRotation(this.state);
        });
    }

    bindControls() {
        const getEl = (id) => document.getElementById(id);

        const updateTransforms = () => {
             this.sceneManager.updateCubeTransforms(this.state);
        };

        // Scale
        getEl('scale-x').addEventListener('input', (e) => {
            this.state.setScale(e.target.value, undefined, undefined);
            updateTransforms();
        });
        getEl('scale-y').addEventListener('input', (e) => {
            this.state.setScale(undefined, e.target.value, undefined);
            updateTransforms();
        });
        getEl('scale-z').addEventListener('input', (e) => {
            this.state.setScale(undefined, undefined, e.target.value);
            updateTransforms();
        });

        // Rotation Axis
        getEl('rot-x').addEventListener('change', (e) => {
            this.state.setRotationAxis('x', e.target.checked);
        });
        getEl('rot-y').addEventListener('change', (e) => {
            this.state.setRotationAxis('y', e.target.checked);
        });
        getEl('rot-z').addEventListener('change', (e) => {
            this.state.setRotationAxis('z', e.target.checked);
        });

        // Rotation Speed
        getEl('rot-speed').addEventListener('input', (e) => {
            this.state.setRotationSpeed(e.target.value);
        });

        // Color
        getEl('cube-color').addEventListener('input', (e) => {
            this.state.setColor(e.target.value);
            updateTransforms();
        });
    }
}