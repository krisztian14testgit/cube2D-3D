import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderShared3DCubePageSpy = vi.fn();

vi.mock('../../../gpt5.3-codex/features/cube-3d/render3DCubePage.js', () => ({
    render3DCubePage: (...args) => renderShared3DCubePageSpy(...args)
}));

import {
    GROK_MENU7_DEFAULTS,
    renderGrok3DCubePage
} from './render3DCubePage.js';

describe('renderGrok3DCubePage', () => {
    beforeEach(() => {
        renderShared3DCubePageSpy.mockReset().mockReturnValue({ cleanup: vi.fn() });
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('forwards the menu7 defaults to the shared Babylon renderer', () => {
        const root = document.getElementById('root');
        const result = renderGrok3DCubePage(root);

        expect(renderShared3DCubePageSpy).toHaveBeenCalledTimes(1);
        expect(renderShared3DCubePageSpy).toHaveBeenCalledWith(root, GROK_MENU7_DEFAULTS);
        expect(result).toBeTruthy();
    });

    it('allows callers to override individual defaults', () => {
        const root = document.getElementById('root');

        renderGrok3DCubePage(root, { title: 'Custom Grok cube' });

        expect(renderShared3DCubePageSpy).toHaveBeenCalledWith(root, {
            ...GROK_MENU7_DEFAULTS,
            title: 'Custom Grok cube'
        });
    });
});
