import { beforeEach, describe, expect, it, vi } from 'vitest';

const pageRenderers = {
    menu1: vi.fn(),
    menu2: vi.fn(),
    menu3: vi.fn(),
    menu4: vi.fn(),
    menu5: vi.fn(),
    menu6: vi.fn(),
    menu7: vi.fn()
};

vi.mock('../pages/menu1.js', () => ({ renderMenu1: (...args) => pageRenderers.menu1(...args) }));
vi.mock('../pages/menu2.js', () => ({ renderMenu2: (...args) => pageRenderers.menu2(...args) }));
vi.mock('../pages/menu3.js', () => ({ renderMenu3: (...args) => pageRenderers.menu3(...args) }));
vi.mock('../pages/menu4.js', () => ({ renderMenu4: (...args) => pageRenderers.menu4(...args) }));
vi.mock('../pages/menu5.js', () => ({ renderMenu5: (...args) => pageRenderers.menu5(...args) }));
vi.mock('../pages/menu6.js', () => ({ renderMenu6: (...args) => pageRenderers.menu6(...args) }));
vi.mock('../pages/menu7.js', () => ({ renderMenu7: (...args) => pageRenderers.menu7(...args) }));

import { Menu } from './Menu.js';

describe('Menu', () => {
    beforeEach(() => {
        Object.values(pageRenderers).forEach((renderer) => renderer.mockReset());
        document.body.innerHTML = '<div id="nav"></div><div id="content"></div>';
    });

    it('renders a menu7 navigation entry and routes clicks to it', () => {
        const nav = document.getElementById('nav');
        const content = document.getElementById('content');
        const menu = new Menu(nav, content, '1.5.1');

        menu.render();

        const menu7Link = nav.querySelector('a[data-route="menu7"]');
        const initialRenderCalls = Object.values(pageRenderers)
            .reduce((total, renderer) => total + renderer.mock.calls.length, 0);

        expect(menu7Link).toBeTruthy();
        expect(menu7Link.textContent).toBe('Grok4.5 - 3D cube');
        expect(initialRenderCalls).toBe(1);
        expect(pageRenderers.menu7).not.toHaveBeenCalled();

        menu7Link.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(pageRenderers.menu7).toHaveBeenCalledTimes(1);
        expect(pageRenderers.menu7).toHaveBeenCalledWith(content);
        expect(menu7Link.classList.contains('active')).toBe(true);
    });
});
