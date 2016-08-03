import {
    PerspectiveCamera,
    Scene,
    Object3D,
    BoxBufferGeometry,
    Mesh,
    MeshBasicMaterial,
    WebGLRenderer,
    Color,
} from "three";

class Tetriminos {
    public color: Color;
    public object: Object3D;
}

class TetriminosI extends Tetriminos {
    constructor() {
        super();
        const size = 100;
        let geometry = new BoxBufferGeometry(size, size, size)
        let material = new MeshBasicMaterial({ color: 0x00cc00, wireframe: true });
        this.object = new THREE.Object3D();
        [0, 1, 2, 3].forEach(i => {
            let mesh = new Mesh(geometry, material);
            mesh.position.x = size * i;
            this.object.add(mesh);
        });
    }
}

let sceneRotation = 0.005;

let camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 400;

let scene = new Scene();

let I = new TetriminosI();
scene.add(I.object);

let renderer = new WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

window.onresize = onresize;
document.onkeydown = onkeydown;

animate();

function onresize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    scene.rotation.y += sceneRotation;
    renderer.render(scene, camera);
}

function onkeydown(event: KeyboardEvent) {
    switch (event.key) {
        case "ArrowUp":
            break;
        case "ArrowDown":
            break;
        case "ArrowLeft":
            I.object.position.x--;
            break;
        case "ArrowRight":
            I.object.position.x++;
            break;
    }
}
