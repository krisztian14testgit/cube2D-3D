import { render3DCubePage } from '../grok4.5/features/cube-3d/render3DCubePage.js';

export function renderMenu7(container) {
    return render3DCubePage(container, {
        title: 'Grok4.5 - 3D babylonjs',
        canvasId: 'canvas-menu7-3d',
        scaleId: 'cube-scale-menu7',
        rotationAxisId: 'cube-rotation-axis-menu7',
        rotationSpeedId: 'cube-rotation-speed-menu7',
        cubeColorId: 'cube-color-menu7',
        controlPanelId: 'cube-controls-menu7',
        statusId: 'cube-status-menu7',
        createdBy: 'Grok4.5'
    });
}
