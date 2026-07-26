const MIN_MAX_CUBES = 10;
const MAX_MAX_CUBES = 100;
const MIN_CUBE_SCALE = 1;
const MAX_CUBE_SCALE = 5;
const MAX_LINEAR_SPEED = 0.08;
const MAX_ROTATION_SPEED = 0.03;

function randomBetween(min, max, random = Math.random) {
    return min + (max - min) * random();
}

export function clampMaxCubeCount(value, min = MIN_MAX_CUBES, max = MAX_MAX_CUBES) {
    if (Number.isNaN(value)) {
        return min;
    }

    return Math.min(max, Math.max(min, Math.round(value)));
}

export function createRandomCubeState(spawnPoint, random = Math.random) {
    const scale = randomBetween(MIN_CUBE_SCALE, MAX_CUBE_SCALE, random);

    return {
        spawnPoint,
        scale,
        velocity: {
            x: randomBetween(-MAX_LINEAR_SPEED, MAX_LINEAR_SPEED, random),
            y: randomBetween(-MAX_LINEAR_SPEED, MAX_LINEAR_SPEED, random),
            z: randomBetween(-MAX_LINEAR_SPEED, MAX_LINEAR_SPEED, random)
        },
        rotationVelocity: {
            x: randomBetween(-MAX_ROTATION_SPEED, MAX_ROTATION_SPEED, random),
            y: randomBetween(-MAX_ROTATION_SPEED, MAX_ROTATION_SPEED, random),
            z: randomBetween(-MAX_ROTATION_SPEED, MAX_ROTATION_SPEED, random)
        }
    };
}

export function collectCollisionIndexes(cubes) {
    const indexesToRemove = new Set();

    for (let i = 0; i < cubes.length; i += 1) {
        for (let j = i + 1; j < cubes.length; j += 1) {
            const cubeA = cubes[i];
            const cubeB = cubes[j];
            const collisionDistance = cubeA.position.distanceTo(cubeB.position);
            const minDistance = cubeA.collisionRadius + cubeB.collisionRadius;

            if (collisionDistance <= minDistance) {
                indexesToRemove.add(i);
                indexesToRemove.add(j);
            }
        }
    }

    return [...indexesToRemove].sort((a, b) => b - a);
}

export function shouldBounceFromBoundary(position, velocity, boundaryRadius, collisionRadius) {
    const nextDistance = position.length();
    const isAtBoundary = nextDistance + collisionRadius >= boundaryRadius;
    const movingOutward = position.dot(velocity) > 0;
    return isAtBoundary && movingOutward;
}

export const CUBES_EXPLODING_CONSTANTS = Object.freeze({
    MIN_MAX_CUBES,
    MAX_MAX_CUBES,
    MIN_CUBE_SCALE,
    MAX_CUBE_SCALE
});
