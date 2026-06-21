import { renderCoordinateMenuPage } from '../features/coordinate-system/renderCoordinateMenuPage.js';

export function renderMenu2(container) {
    renderCoordinateMenuPage(container, {
        title: 'Menu 2 - Basic Coordinate System',
        canvasId: 'canvas-menu2',
        hideGridId: 'hide-grid-2',
        sliderId: 'my-slider-2'
    });
}
