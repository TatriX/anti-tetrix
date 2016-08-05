import {
    OrthographicCamera,
    Scene,
    WebGLRenderer,
    Color,
    GridHelper,
    AmbientLight,
    DirectionalLight,
} from "three";

import Tetrimino from "tetrimino";
import Stats from "stats";
import Board from "board";

export let debug = false;

let stats = new Stats();
stats.dom.id = "stats";
document.body.appendChild(stats.dom);

let sceneRotation = 0.01;

let width = document.body.clientWidth;
let height = document.body.clientHeight;
let camera = new OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000);
camera.position.z = 400;

let scene = new Scene();

let board = new Board();
scene.add(board.object);

let ambientLight = new AmbientLight(0x404040);
scene.add(ambientLight);

let directionalLight = new DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 0, 100);
scene.add(directionalLight);

scene.rotation.x = Math.PI / 12;
scene.rotation.y = Math.PI / 12;

if (debug) {
    let grid = new GridHelper(Tetrimino.size ** 2, Tetrimino.size * 2, 0x333333, 0x333333);
    grid.rotation.z = Math.PI / 2;
    grid.rotation.y = Math.PI / 2;
    grid.position.z = -Tetrimino.size;
    scene.add(grid);
}

let renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);

document.body.appendChild(renderer.domElement);

window.onresize = onresize;
document.onkeydown = onkeydown;
document.onkeyup = onkeyup;

animate();

function onresize() {
    let width = document.body.clientWidth;
    let height = document.body.clientHeight;
    camera.left = width / - 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / - 2
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

let pause = false;
function animate() {
    stats.begin();
    // scene.rotation.y += sceneRotation;
    if (!pause) {
        board.update();
        renderer.render(scene, camera);
    }
    stats.end();
    requestAnimationFrame(animate);
}

function onkeydown(event: KeyboardEvent) {
    switch (event.key) {
        case "ArrowUp":
            board.rotateCurrent();
            break;
        case "ArrowDown":
            board.speedUp = true;
            break;
        case "ArrowLeft":
            board.moveCurrentLeft();
            break;
        case "ArrowRight":
            board.moveCurrentRight();
            break;
        case "Escape":
            pause = !pause;
            break;
    }
}

function onkeyup(event: KeyboardEvent) {
    switch (event.key) {
        case "ArrowDown":
            board.speedUp = false;
            break;
    }
}
