import { renderCoordinateMenuPage } from '../gpt5.3-codex/features/coordinate-system/renderCoordinateMenuPage.js';

export function renderMenu4(container) {
    renderCoordinateMenuPage(container, {
        title: 'Menu 4 - Coordinate System',
        canvasId: 'canvas-menu4',
        hideGridId: 'hide-grid-4',
        sliderId: 'my-slider-4'
    });
}
