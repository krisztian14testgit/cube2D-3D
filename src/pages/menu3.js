import { renderCoordinateMenuPage } from '../features/coordinate-system/renderCoordinateMenuPage.js';

export function renderMenu3(container) {
    renderCoordinateMenuPage(container, {
        title: 'Menu 3 - Coordinate System',
        canvasId: 'canvas-menu3',
        hideGridId: 'hide-grid-3',
        sliderId: 'my-slider-3'
    });
}
