export const DEFAULT_SPHERE_SCALE = 8;
export const DEFAULT_MAX_CUBES = 10;
export const MIN_MAX_CUBES = 10;
export const MAX_MAX_CUBES = 100;
export const MIN_CUBE_SCALE = 1;
export const MAX_CUBE_SCALE = 5;

/**
 * Clamp max-cube setting into the allowed UI range.
 */
export function clampMaxCubes(value, min = MIN_MAX_CUBES, max = MAX_MAX_CUBES) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return min;
    }
    return Math.min(max, Math.max(min, Math.round(numeric)));
}

/**
 * Random cube edge length in [min, max].
 */
export function randomCubeScale(min = MIN_CUBE_SCALE, max = MAX_CUBE_SCALE, rng = Math.random) {
    return min + rng() * (max - min);
}

/**
 * Random linear velocity vector components.
 */
export function randomVelocity(rng = Math.random, magnitude = 0.08) {
    return {
        x: (rng() - 0.5) * 2 * magnitude,
        y: (rng() - 0.5) * 2 * magnitude,
        z: (rng() - 0.5) * 2 * magnitude
    };
}

/**
 * Random angular velocity (radians per frame-ish unit).
 */
export function randomRotationSpeed(rng = Math.random, magnitude = 0.04) {
    return {
        x: (rng() - 0.5) * 2 * magnitude,
        y: (rng() - 0.5) * 2 * magnitude,
        z: (rng() - 0.5) * 2 * magnitude
    };
}

/**
 * Half-space diagonal of a cube with edge length `scale` (bounding sphere radius).
 */
export function cubeHalfExtent(scale) {
    return (scale * Math.sqrt(3)) / 2;
}

export function distance3(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function vectorLength(v) {
    return Math.hypot(v.x, v.y, v.z);
}

export function dot3(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Pairwise sphere-approx collision. Each cube: { x, y, z, halfExtent }.
 * @returns {number[]} unique indexes involved in at least one collision
 */
export function collectCollisionIndexes(cubes) {
    const hit = new Set();

    for (let i = 0; i < cubes.length; i += 1) {
        for (let j = i + 1; j < cubes.length; j += 1) {
            const a = cubes[i];
            const b = cubes[j];
            const threshold = a.halfExtent + b.halfExtent;
            if (distance3(a, b) < threshold) {
                hit.add(i);
                hit.add(j);
            }
        }
    }

    return [...hit];
}

export function sortIndexesDescending(indexes) {
    return [...indexes].sort((a, b) => b - a);
}

/**
 * Bounce when center is beyond the usable inner radius and velocity points outward.
 */
export function shouldBounceOffSphere(position, velocity, sphereRadius, cubeHalfExtentValue) {
    const limit = Math.max(0, sphereRadius - cubeHalfExtentValue);
    const distanceFromOrigin = vectorLength(position);
    if (distanceFromOrigin <= limit) {
        return false;
    }
    return dot3(position, velocity) > 0;
}

export function bounceVelocity(velocity) {
    // Multiply by -1 and coerce -0 to 0 for stable comparisons/serialization.
    const negate = (value) => {
        const next = -value;
        return Object.is(next, -0) ? 0 : next;
    };

    return {
        x: negate(velocity.x),
        y: negate(velocity.y),
        z: negate(velocity.z)
    };
}

/**
 * Keep spawn point inside the sphere with a safety margin for the cube size.
 */
export function clampPointInsideSphere(point, sphereRadius, cubeHalfExtentValue, shrink = 0.85) {
    const maxDistance = Math.max(0.01, (sphereRadius - cubeHalfExtentValue) * shrink);
    const length = vectorLength(point);
    if (length === 0 || length <= maxDistance) {
        return { x: point.x, y: point.y, z: point.z };
    }
    const scale = maxDistance / length;
    return {
        x: point.x * scale,
        y: point.y * scale,
        z: point.z * scale
    };
}
