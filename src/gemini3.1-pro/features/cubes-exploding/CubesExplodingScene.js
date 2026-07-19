import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class Explosion {
    constructor(scene, position) {
        this.scene = scene;
        this.particles = [];
        this.active = true;
        this.age = 0;
        this.maxAge = 30; // frames

        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0xff4444 });

        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            this.particles.push(particle);
            this.scene.add(particle);
        }
    }

    update() {
        if (!this.active) return;
        this.age++;
        if (this.age > this.maxAge) {
            this.active = false;
            this.particles.forEach(p => this.scene.remove(p));
            return;
        }

        this.particles.forEach(p => {
            p.position.add(p.velocity);
            p.material.opacity = 1 - (this.age / this.maxAge);
            p.material.transparent = true;
        });
    }
}

export class CubesExplodingScene {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.sphere = null;

        this.cubes = [];
        this.explosions = [];
        this.maxCubes = 10;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.onMouseClick = this.onMouseClick.bind(this);
    }

    initialize() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        this.camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 1000);
        this.camera.position.set(0, 0, 50);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // Users can rotate the camera using the right mouse click
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.NONE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(10, 10, 10);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040));

        this.createSphereBoundary(8);

        window.addEventListener('resize', this.handleResize);
        this.canvas.addEventListener('mousedown', this.onMouseClick);

        this.animate();
    }

    createSphereBoundary(scale) {
        if (this.sphere) {
            this.scene.remove(this.sphere);
            this.sphere.geometry.dispose();
            this.sphere.material.dispose();
        }
        const geometry = new THREE.SphereGeometry(scale, 32, 32);
        // wireframe to have lines drawing as borders on the sphere surface
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.3 
        });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);
    }

    bindControls() {
        const scaleInput = document.getElementById('sphere-scale');
        const scaleVal = document.getElementById('sphere-scale-val');
        if (scaleInput) {
            scaleInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                scaleVal.innerText = val;
                this.updateSphereScale(val);
            });
        }

        const maxCubesInput = document.getElementById('max-cubes');
        if (maxCubesInput) {
            maxCubesInput.addEventListener('change', (e) => {
                let val = parseInt(e.target.value, 10);
                if (val < 10) val = 10;
                if (val > 100) val = 100;
                e.target.value = val;
                this.maxCubes = val;
            });
        }
    }

    updateSphereScale(scale) {
        if (this.sphere) {
            this.sphere.scale.set(scale, scale, scale);
        }
    }

    onMouseClick(event) {
        if (event.button !== 0) return; // Left click only

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Intersect with sphere to find spawn point inside or on surface
        const intersects = this.raycaster.intersectObject(this.sphere);
        if (intersects.length > 0) {
            // Spawn inside a bit closer to camera or at the intersection
            const point = intersects[0].point;
            this.spawnCube(point);
        }
    }

    spawnCube(position) {
        if (this.cubes.length >= this.maxCubes) {
            return; // limit reached
        }

        // Random scale [1-5]
        const scale = 1 + Math.random() * 4;
        const geometry = new THREE.BoxGeometry(scale, scale, scale);
        const material = new THREE.MeshLambertMaterial({ 
            color: Math.random() * 0xffffff
        });
        const cube = new THREE.Mesh(geometry, material);

        cube.position.copy(position);
        
        // To keep them inside the sphere, we might push them towards center if spawned on edge
        cube.position.multiplyScalar(0.8);

        // Random rotations
        cube.rotationVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        // Random movement velocity
        cube.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );

        this.scene.add(cube);
        this.cubes.push(cube);
    }

    updateCubes() {
        const sphereRadius = this.sphere ? this.sphere.geometry.parameters.radius * this.sphere.scale.x : 8;

        for (let i = 0; i < this.cubes.length; i++) {
            const cube = this.cubes[i];
            cube.rotation.x += cube.rotationVelocity.x;
            cube.rotation.y += cube.rotationVelocity.y;
            cube.rotation.z += cube.rotationVelocity.z;

            cube.position.add(cube.velocity);

            // Bounce off sphere boundary
            const distance = cube.position.length();
            if (distance > sphereRadius - 1) { // rough collision with boundary
                cube.velocity.negate();
            }
        }
    }

    checkCollisions() {
        const toRemove = new Set();

        for (let i = 0; i < this.cubes.length; i++) {
            for (let j = i + 1; j < this.cubes.length; j++) {
                const c1 = this.cubes[i];
                const c2 = this.cubes[j];
                const dist = c1.position.distanceTo(c2.position);
                
                // approximate bounding sphere collision based on scale
                const r1 = c1.geometry.parameters.width * 0.866; // approx circumradius (sqrt(3)/2 ~ 0.866)
                const r2 = c2.geometry.parameters.width * 0.866;

                if (dist < r1 + r2) {
                    toRemove.add(i);
                    toRemove.add(j);
                }
            }
        }

        if (toRemove.size > 0) {
            const indexes = Array.from(toRemove).sort((a, b) => b - a);
            for (const index of indexes) {
                const cube = this.cubes[index];
                this.explosions.push(new Explosion(this.scene, cube.position));
                this.scene.remove(cube);
                this.cubes.splice(index, 1);
            }
        }
    }

    animate() {
        if (!this.renderer) return;

        requestAnimationFrame(this.animate);
        
        if (this.controls) this.controls.update();

        this.updateCubes();
        this.checkCollisions();

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update();
            if (!this.explosions[i].active) {
                this.explosions.splice(i, 1);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        if (!this.canvas || !this.renderer) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        window.removeEventListener('resize', this.handleResize);
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.onMouseClick);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.controls) {
            this.controls.dispose();
        }
        // Additional cleanup if needed
    }
}