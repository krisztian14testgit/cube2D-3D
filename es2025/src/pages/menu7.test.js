import { beforeEach, describe, expect, it, vi } from 'vitest';

const render3DCubePageSpy = vi.fn();

vi.mock('../grok4.5/features/cube-3d/render3DCubePage.js', () => ({
    render3DCubePage: (...args) => render3DCubePageSpy(...args)
}));

import { renderMenu7 } from './menu7.js';

describe('renderMenu7', () => {
    beforeEach(() => {
        render3DCubePageSpy.mockReset().mockReturnValue({ cleanup: vi.fn() });
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('renders the Grok 4.5 Babylon 3D cube page', () => {
        const root = document.getElementById('root');
        const result = renderMenu7(root);

        expect(render3DCubePageSpy).toHaveBeenCalledTimes(1);
        expect(render3DCubePageSpy).toHaveBeenCalledWith(root);
        expect(result).toBeTruthy();
    });
});
