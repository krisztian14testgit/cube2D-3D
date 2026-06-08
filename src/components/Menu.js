import { renderMenu1 } from '../pages/menu1.js';
import { renderMenu2 } from '../pages/menu2.js';
import { renderMenu3 } from '../pages/menu3.js';
import { renderMenu4 } from '../pages/menu4.js';

export class Menu {
    constructor(navContainer, contentContainer, version = '1.0.0') {
        this.navContainer = navContainer;
        this.contentContainer = contentContainer;
        this.version = version;
        this.routes = {
            'menu1': renderMenu1,
            'menu2': renderMenu2,
            'menu3': renderMenu3,
            'menu4': renderMenu4
        };
    }

    render() {
        this.navContainer.innerHTML = `
            <nav class="main-menu">
                <ul>
                    <li><a href="#menu1" data-route="menu1">Menu 1</a></li>
                    <li><a href="#menu2" data-route="menu2">Menu 2</a></li>
                    <li><a href="#menu3" data-route="menu3">Menu 3</a></li>
                    <li><a href="#menu4" data-route="menu4">Menu 4</a></li>
                </ul>
                <div class="version-info">v${this.version}</div>
            </nav>
        `;

        this.navContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                this.navigate(route);
            }
        });

        // Load default route
        this.navigate('menu1');
    }

    navigate(route) {
        // Update active class
        const links = this.navContainer.querySelectorAll('a');
        links.forEach(link => {
            if (link.getAttribute('data-route') === route) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Render page
        const renderFunction = this.routes[route];
        if (renderFunction) {
            renderFunction(this.contentContainer);
        }
    }
}
