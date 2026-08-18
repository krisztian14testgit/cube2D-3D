import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderGrok3DCubePageSpy = vi.fn();

vi.mock('../grok-4.5/features/cube-3d/render3DCubePage.js', () => ({
    renderGrok3DCubePage: (...args) => renderGrok3DCubePageSpy(...args)
}));

import { renderMenu7 } from './menu7.js';

describe('renderMenu7', () => {
    beforeEach(() => {
        renderGrok3DCubePageSpy.mockReset().mockReturnValue({ cleanup: vi.fn() });
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('renders the Grok 4.5 cube page', () => {
        const root = document.getElementById('root');
        const result = renderMenu7(root);

        expect(renderGrok3DCubePageSpy).toHaveBeenCalledTimes(1);
        expect(renderGrok3DCubePageSpy).toHaveBeenCalledWith(root);
        expect(result).toBeTruthy();
    });
});
