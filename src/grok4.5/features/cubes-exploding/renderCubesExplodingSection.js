import {
    DEFAULT_MAX_CUBES,
    DEFAULT_SPHERE_SCALE,
    createBabylonCubesExplodingController
} from './BabylonCubesExplodingController.js';
import { clampMaxCubes } from './cubesExplodingMath.js';

export const GROK_CUBES_EXPLODING_DEFAULTS = Object.freeze({
    sectionTitle: 'Grok4.5 - Cubes exploding',
    canvasId: 'canvas-menu7-cubes-exploding',
    sphereScaleId: 'sphere-scale-menu7-exploding',
    sphereScaleValueId: 'sphere-scale-value-menu7-exploding',
    maxCubesId: 'max-cubes-menu7-exploding',
    statusId: 'cubes-exploding-status-menu7',
    sectionId: 'cubes-exploding-section-menu7',
    createdBy: 'Grok 4.5'
});

export function createCubesExplodingMarkup({
    sectionTitle,
    canvasId,
    sphereScaleId,
    sphereScaleValueId,
    maxCubesId,
    statusId,
    sectionId
}) {
    return `
        <hr class="feature-divider" />
        <section id="${sectionId}" class="cubes-exploding-section">
            <h2>${sectionTitle}</h2>
            <p>Left-click inside the transparent sphere to spawn cubes. Cubes bounce on the boundary and explode on contact. Right-drag orbits the camera; wheel zooms.</p>
            <div class="canvas-container">
                <canvas id="${canvasId}" width="513" height="513"></canvas>
                <div class="manipulations">
                    <p id="${statusId}">Cubes: 0 / ${DEFAULT_MAX_CUBES}</p>
                    <fieldset>
                        <legend>Sphere &amp; cube limits</legend>
                        <label for="${sphereScaleId}">Sphere scale</label>
                        <input
                            id="${sphereScaleId}"
                            type="range"
                            min="4"
                            max="20"
                            step="0.5"
                            value="${DEFAULT_SPHERE_SCALE}"
                        >
                        <span id="${sphereScaleValueId}">${DEFAULT_SPHERE_SCALE}</span>
                        <label for="${maxCubesId}">Max cubes</label>
                        <input
                            id="${maxCubesId}"
                            type="number"
                            min="10"
                            max="100"
                            step="1"
                            value="${DEFAULT_MAX_CUBES}"
                        >
                    </fieldset>
                </div>
            </div>
        </section>
    `;
}

function updateStatus(statusEl, count, max) {
    if (statusEl) {
        statusEl.textContent = `Cubes: ${count} / ${max}`;
    }
}

export function initializeCubesExplodingInteractions(
    container,
    {
        canvasId,
        sphereScaleId,
        sphereScaleValueId,
        maxCubesId,
        statusId,
        controllerFactory = createBabylonCubesExplodingController
    }
) {
    const canvas = container.querySelector(`#${canvasId}`);
    if (!canvas) {
        throw new Error('Exploding cubes canvas element not found');
    }

    const controls = {
        sphereScale: container.querySelector(`#${sphereScaleId}`),
        sphereScaleValue: container.querySelector(`#${sphereScaleValueId}`),
        maxCubes: container.querySelector(`#${maxCubesId}`),
        status: container.querySelector(`#${statusId}`)
    };

    const controller = controllerFactory(canvas, {
        sphereScale: Number(controls.sphereScale?.value ?? DEFAULT_SPHERE_SCALE),
        maxCubes: clampMaxCubes(controls.maxCubes?.value ?? DEFAULT_MAX_CUBES),
        onCubeCountChange: (count, max) => updateStatus(controls.status, count, max)
    });

    updateStatus(controls.status, controller.getCubeCount?.() ?? 0, controller.maxCubes ?? DEFAULT_MAX_CUBES);

    const onSphereScaleInput = () => {
        const value = Number(controls.sphereScale?.value ?? DEFAULT_SPHERE_SCALE);
        if (controls.sphereScaleValue) {
            controls.sphereScaleValue.textContent = String(value);
        }
        controller.setSphereScale(value);
    };

    const onMaxCubesChange = () => {
        const clamped = clampMaxCubes(controls.maxCubes?.value ?? DEFAULT_MAX_CUBES);
        if (controls.maxCubes) {
            controls.maxCubes.value = String(clamped);
        }
        controller.setMaxCubes(clamped);
        updateStatus(
            controls.status,
            controller.getCubeCount?.() ?? 0,
            controller.maxCubes ?? clamped
        );
    };

    controls.sphereScale?.addEventListener('input', onSphereScaleInput);
    controls.maxCubes?.addEventListener('change', onMaxCubesChange);

    const cleanup = () => {
        controls.sphereScale?.removeEventListener('input', onSphereScaleInput);
        controls.maxCubes?.removeEventListener('change', onMaxCubesChange);
        controller.dispose();
    };

    return { canvas, controller, cleanup };
}

/**
 * Append exploding-cubes markup into an existing page container and wire interactions.
 */
export function appendCubesExplodingSection(container, options = {}) {
    const config = {
        ...GROK_CUBES_EXPLODING_DEFAULTS,
        ...options
    };

    const wrapper = document.createElement('div');
    wrapper.innerHTML = createCubesExplodingMarkup(config);
    while (wrapper.firstChild) {
        container.appendChild(wrapper.firstChild);
    }

    return initializeCubesExplodingInteractions(container, {
        canvasId: config.canvasId,
        sphereScaleId: config.sphereScaleId,
        sphereScaleValueId: config.sphereScaleValueId,
        maxCubesId: config.maxCubesId,
        statusId: config.statusId,
        controllerFactory: config.controllerFactory
    });
}
