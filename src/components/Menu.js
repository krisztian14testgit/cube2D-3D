const DEFAULT_ROUTE = 'menu1';
const ROUTES = Object.freeze({
    menu1: () => import('../pages/menu1.js').then((module) => module.renderMenu1),
    menu2: () => import('../pages/menu2.js').then((module) => module.renderMenu2),
    menu3: () => import('../pages/menu3.js').then((module) => module.renderMenu3),
    menu4: () => import('../pages/menu4.js').then((module) => module.renderMenu4),
    menu5: () => import('../pages/menu5.js').then((module) => module.renderMenu5),
    menu6: () => import('../pages/menu6.js').then((module) => module.renderMenu6),
    menu7: () => import('../pages/menu7.js').then((module) => module.renderMenu7)
});

export class Menu {
    constructor(navContainer, contentContainer, version = '1.0.0') {
        this.navContainer = navContainer;
        this.contentContainer = contentContainer;
        this.version = version;
        this.routes = ROUTES;
        this.navigationId = 0;
    }

    render() {
        this.navContainer.innerHTML = `
            <nav class="main-menu">
                <ul>
                    <li><a href="#menu1" data-route="menu1">Basic</a></li>
                    <li><a href="#menu2" data-route="menu2">GPT-5.3-Codex </a></li>
                    <li><a href="#menu3" data-route="menu3">Gemini 3.1 pro </a></li>
                    <li><a href="#menu4" data-route="menu4">Claude Sonnet 4.6</a></li>
                    <li><a href="#menu5" data-route="menu5">Gemini3.1-pro - 3D threejs</a></li>
                    <li><a href="#menu6" data-route="menu6">GPT5.3-codex - 3D babylonjs</a></li>
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

    async navigate(route) {
        const links = this.navContainer.querySelectorAll('a');
        links.forEach((link) => {
            if (link.getAttribute('data-route') === route) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        const navigationId = ++this.navigationId;
        const loadRoute = this.routes[route];
        if (loadRoute) {
            const renderFunction = await loadRoute();
            if (navigationId === this.navigationId) {
                renderFunction(this.contentContainer);
            }
        }
    }
}
