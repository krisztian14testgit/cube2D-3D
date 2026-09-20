/**
 * "Basic" landing page of the app (default route).
 *
 * It serves as an in-app "About this project" page so a visitor immediately
 * understands what the project is, why it exists.
 */

const MENU_OVERVIEW = [
    {
        label: 'Basic',
        detail: 'This page — a project overview, not tied to any single LLM.'
    },
    {
        label: 'GPT-5.3-Codex',
        detail: 'Coordinate system + bouncing/rotating squares implemented by GPT-5.3 Codex.'
    },
    {
        label: 'Gemini 3.1 pro',
        detail: 'Coordinate system + bouncing/rotating squares implemented by Gemini 3.1 Pro.'
    },
    {
        label: 'Claude Sonnet 4.6',
        detail: 'Coordinate system + bouncing/rotating squares implemented by Claude Sonnet 4.6.'
    },
    {
        label: 'Gemini3.1-pro - 3D cube',
        detail: '3D cube feature reserved for Gemini 3.1 Pro.'
    },
    {
        label: 'GPT5.3-codex - 3D cube',
        detail: '3D cube feature reserved for GPT-5.3 Codex.'
    },
    {
        label: 'Grok4.5 - 3D babylonjs',
        detail: '3D cube rendering and the "cubes exploding" scene implemented by Grok 4.5 with Babylon.js.'
    }
];

function renderMenuOverviewList() {
    return MENU_OVERVIEW
        .map(({ label, detail }) => `<li><strong>${label}</strong> — ${detail}</li>`)
        .join('');
}

export function renderMenu4(container) {
    container.innerHTML = `
        <article class="project-info">
            <h2>About this project</h2>
            <p>
                <strong>cube2D-3D</strong> is an experimental sandbox for comparing how different
                AI models solve the exact same graphics brief: draw a 2D coordinate system,
                animate bouncing &amp; rotating squares, render a 3D cube, and finally make many
                3D cubes explode inside a bounding sphere.
            </p>

            <h3>Goal of the project</h3>
            <p>
                The same feature specification is handed to several LLM coding agents
                (GPT-5.3 Codex, Gemini 3.1 Pro, Claude Sonnet 4.6, Grok 4.5, ...). Each model
                implements the brief independently, in its own folder under
                <code>src/&lt;model-name&gt;/</code>, without seeing the other models' code.
                A human only reviews, validates, and wires the generated code into this app —
                the feature logic itself is authored by the models. The goal is to observe and
                compare code quality, structure, correctness, and test coverage across models
                solving an identical problem.
            </p>

            <h3>Why the menu labels use LLM names</h3>
            <p>
                Every navigation entry above (except this one) is labelled with the name of the
                model that wrote the code behind it. This makes it obvious, while browsing, whose
                implementation you are currently looking at, and lets you compare the same feature
                (e.g. the coordinate system, or the exploding cubes) side by side across models.
            </p>

            <h3>What each menu section shows</h3>
            <ul>
                ${renderMenuOverviewList()}
            </ul>
        </article>
    `;
}
