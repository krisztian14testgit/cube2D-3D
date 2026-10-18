export class CubeState {
    constructor() {
        this.scale = { x: 1, y: 1, z: 1 };
        this.rotationAxis = { x: false, y: true, z: false };
        this.rotationSpeed = 0.02;
        this.color = '#add8e6';
    }

    setScale(x, y, z) {
        if (x !== undefined && x !== null && !isNaN(Number(x))) this.scale.x = Number(x);
        if (y !== undefined && y !== null && !isNaN(Number(y))) this.scale.y = Number(y);
        if (z !== undefined && z !== null && !isNaN(Number(z))) this.scale.z = Number(z);
    }

    setRotationAxis(axis, value) {
        if (this.rotationAxis.hasOwnProperty(axis)) {
            this.rotationAxis[axis] = Boolean(value);
        }
    }

    setRotationSpeed(speed) {
        if (!isNaN(Number(speed))) {
             this.rotationSpeed = Number(speed);
        }
    }

    setColor(colorHex) {
        if (/^#[0-9A-Fa-f]{6}$/i.test(colorHex)) {
             this.color = colorHex;
        }
    }
}