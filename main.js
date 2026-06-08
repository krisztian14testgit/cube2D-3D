import { Menu } from './src/components/Menu.js';
import packageJson from './package.json';

// Root load: initialize the modern architecture application
export function initApp() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <header id="header"></header>
        <main id="content"></main>
    `;

    const navContainer = document.getElementById('header');
    const contentContainer = document.getElementById('content');

    const menu = new Menu(navContainer, contentContainer, packageJson.version);
    menu.render();
}

initApp();