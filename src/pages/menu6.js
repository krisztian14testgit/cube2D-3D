import { render3DCubePage } from '../gpt5.3-codex/features/cube-3d/render3DCubePage.js';

export function renderMenu6(container) {
    return render3DCubePage(container, {
        title: 'GPT5.3-codex - 3D cube',
        canvasId: 'canvas-menu6-3d',
        scaleId: 'cube-scale-menu6',
        rotationAxisId: 'cube-rotation-axis-menu6',
        rotationSpeedId: 'cube-rotation-speed-menu6',
        cubeColorId: 'cube-color-menu6',
        controlPanelId: 'cube-controls-menu6',
        statusId: 'cube-status-menu6'
    });
}
