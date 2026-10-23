import * as THREE from 'three';

export class ThreejsCubeScene {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.cube = null;
        this.cubeMaterial = null;
        this.animationFrameId = null;
        this.onBeforeRenderCallbacks = [];
    }

    initialize() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setClearColor(0xe5e5e5);

        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 40, 20);
        this.scene.add(dirLight);

        // Coordinate system (Axes)
        const axesHelper = new THREE.AxesHelper( 5 );
        this.scene.add(axesHelper);

        // Click handler to create cube (raycaster)
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        this.canvas.addEventListener('pointerdown', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children);

            if (intersects.length > 0) {
                this.createOrMoveCube(new THREE.Vector3(0, 0, 0)); // Or intersect point if needed
            } else {
                 this.createOrMoveCube(new THREE.Vector3(0, 0, 0));
            }
        });

        // Resize
        window.addEventListener("resize", () => {
            this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        });

        this.renderLoop();
    }
    
    renderLoop() {
        this.onBeforeRenderCallbacks.forEach(cb => cb());
        this.renderer.render(this.scene, this.camera);
        this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
    }

    createOrMoveCube(position) {
        if (!this.cube) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            this.cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xadd8e6 });
            this.cube = new THREE.Mesh(geometry, this.cubeMaterial);
            this.scene.add(this.cube);
        }
        
        if (position.lengthSq() === 0) {
            this.cube.position.set(0, 0.5, 0);
        } else {
            this.cube.position.copy(position);
        }
    }

    updateCubeTransforms(state) {
        if (!this.cube) return;

        // Scale
        this.cube.scale.set(state.scale.x, state.scale.y, state.scale.z);

        // Color
        if (this.cubeMaterial) {
            this.cubeMaterial.color.set(state.color);
        }
    }

    applyRotation(state) {
        if (!this.cube) return;

        if (state.rotationAxis.x) {
            this.cube.rotation.x += state.rotationSpeed;
        }
        if (state.rotationAxis.y) {
            this.cube.rotation.y += state.rotationSpeed;
        }
        if (state.rotationAxis.z) {
            this.cube.rotation.z += state.rotationSpeed;
        }
    }

    registerRenderLoopCallback(callback) {
         this.onBeforeRenderCallbacks.push(callback);
    }
}