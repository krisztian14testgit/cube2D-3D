import { renderMenu1 } from '../pages/menu1.js';
import { renderMenu2 } from '../pages/menu2.js';
import { renderMenu3 } from '../pages/menu3.js';
import { renderMenu4 } from '../pages/menu4.js';

const DEFAULT_ROUTE = 'menu1';
const ROUTES = Object.freeze({
    menu1: renderMenu1,
    menu2: renderMenu2,
    menu3: renderMenu3,
    menu4: renderMenu4
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
                    <li><a href="#menu1" data-route="menu1">GPT-5.3-Codex</a></li>
                    <li><a href="#menu2" data-route="menu2">Gemini 3.1 pro</a></li>
                    <li><a href="#menu3" data-route="menu3">Claude Sonner 4.6</a></li>
                    <li><a href="#menu4" data-route="menu4">Menu 4</a></li>
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
