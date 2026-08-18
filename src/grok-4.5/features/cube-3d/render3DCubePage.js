import { render3DCubePage as renderShared3DCubePage } from '../../../gpt5.3-codex/features/cube-3d/render3DCubePage.js';

export const GROK_MENU7_DEFAULTS = Object.freeze({
    title: 'Grok4.5 - 3D cube',
    canvasId: 'canvas-menu7-3d',
    scaleId: 'cube-scale-menu7',
    rotationAxisId: 'cube-rotation-axis-menu7',
    rotationSpeedId: 'cube-rotation-speed-menu7',
    cubeColorId: 'cube-color-menu7',
    controlPanelId: 'cube-controls-menu7',
    statusId: 'cube-status-menu7',
    createdBy: 'Grok 4.5'
});

export function renderGrok3DCubePage(container, options = {}) {
    return renderShared3DCubePage(container, {
        ...GROK_MENU7_DEFAULTS,
        ...options
    });
}
