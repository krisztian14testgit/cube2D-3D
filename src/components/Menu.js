import { renderMenu1 as gptCodex } from '../pages/menu1.js';
import { renderMenu2 as geminiPro } from '../pages/menu2.js';
import { renderMenu3 as claudeSonnet } from '../pages/menu3.js';
import { renderMenu4 as basic } from '../pages/menu4.js';
import { renderMenu5 } from '../pages/menu5.js';
import { renderMenu6 } from '../pages/menu6.js';
import { renderMenu7 } from '../pages/menu7.js';

const DEFAULT_ROUTE = 'menu1';
const ROUTES = Object.freeze({
    menu1: basic,
    menu2: gptCodex,
    menu3: geminiPro,
    menu4: claudeSonnet,
    menu5: renderMenu5,
    menu6: renderMenu6,
    menu7: renderMenu7
});

export class Menu {
    constructor(navContainer, contentContainer, version = '1.0.0') {
        this.navContainer = navContainer;
        this.contentContainer = contentContainer;
        this.version = version;
        this.routes = ROUTES;
    }

    render() {
        this.navContainer.innerHTML = `
            <nav class="main-menu">
                <ul>
                    <li><a href="#menu1" data-route="menu1">Basic</a></li>
                    <li><a href="#menu2" data-route="menu2">GPT-5.3-Codex </a></li>
                    <li><a href="#menu3" data-route="menu3">Gemini 3.1 pro </a></li>
                    <li><a href="#menu4" data-route="menu4">Claude Sonnet 4.6</a></li>
                    <li><a href="#menu5" data-route="menu5">Gemini3.1-pro - 3D cube</a></li>
                    <li><a href="#menu6" data-route="menu6">GPT5.3-codex - 3D cube</a></li>
                    <li><a href="#menu7" data-route="menu7">Grok4.5 - 3D babylonjs</a></li>
                </ul>
                <div class="version-info">v${this.version}</div>
            </nav>
        `;

        this.navContainer.addEventListener('click', this.#handleNavClick);
        this.navigate(DEFAULT_ROUTE);
    }

    #handleNavClick = (event) => {
        if (event.target.tagName !== 'A') {
            return;
        }

        event.preventDefault();
        this.navigate(event.target.getAttribute('data-route'));
    };

    navigate(route) {
        const links = this.navContainer.querySelectorAll('a');
        links.forEach((link) => {
            if (link.getAttribute('data-route') === route) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        const renderFunction = this.routes[route];
        if (renderFunction) {
            renderFunction(this.contentContainer);
        }
    }
}
