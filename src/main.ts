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
import xhr from "xhr";
import storage from "storage";

export let debug = document.location.href.match(/debug/)

let stats = new Stats();
stats.dom.id = "stats";
document.body.appendChild(stats.dom);

if (!debug) {
    stats.dom.style.display = "none";
}


let width = document.body.clientWidth;
let height = document.body.clientHeight;
let camera = new OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000);
camera.position.z = 400;

export let scene = new Scene();

let board = new Board();
scene.add(board.object);

let ambientLight = new AmbientLight(0x404040);
scene.add(ambientLight);

let directionalLight = new DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 0, 100);
scene.add(directionalLight);

if (debug) {
    let grid = new GridHelper(Tetrimino.size ** 2, Tetrimino.size * 2, 0x333333, 0x333333);
    grid.rotation.z = Math.PI / 2;
    grid.rotation.y = Math.PI / 2;
    grid.position.z = +Tetrimino.size;
    scene.add(grid);
}

export let renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);

document.body.appendChild(renderer.domElement);

window.onresize = onresize;

interface Enemy {
    img: string;
    name: string;
    setup: () => void;
}

export let story = {
    elem: document.getElementById("story"),
    index: storage.get("story") || 0,
    inBattle: false,
    start: function () {
        this.load();
    },
    loadStory: function (name: string | number) {
        xhr("story/" + name + ".html", (html: string) => {
            story.elem.innerHTML = html;
            document.getElementById("story-help").onclick = this.load.bind(this);
            document.body.onkeydown = this.onkeydown.bind(this);
            document.body.onkeyup = null;
        });
    },
    startBattle: function (enemy: Enemy) {
        scene.rotation.x = 0;
        scene.rotation.y = 0;
        board.reset();
        enemy.setup();
        this.inBattle = true;
        story.elem.style.display = "none";
        document.body.classList.remove("in-story");
        document.body.classList.add("in-battle");

        document.getElementById("enemy").innerHTML = "<img src=assets/" + enemy.img + ".png>" +
            "<span>" + enemy.name + "</span>";
        document.body.onkeydown = onkeydown;
        document.body.onkeyup = onkeyup;
        animate();
    },
    endBattle: function (win: boolean) {
        this.inBattle = false;
        story.elem.style.display = "block";
        document.body.classList.remove("in-battle");
        document.body.classList.add("in-story");
        document.getElementById("enemy").innerHTML = "";
        if (win) {
            this.index++;
            this.load();
        } else {
            this.loadStory("lose");
        }
    },
    onkeydown: function (event: KeyboardEvent) {
        if (event.key == " ") {
            this.load()
        }
    },
    showHelp: function () {
    },
    load: function () {
        storage.set("story", this.index);
        let level = this.levels[this.index];
        switch (typeof level) {
            case "string":
                this.index++;
                this.loadStory(level);
                break;
            case "function":
                this.index++;
                level(() => this.load());
                break;
            case "object":
                let enemy = level as Enemy;
                story.startBattle(enemy);
                break;
            default:
                this.loadStory("win");
                document.getElementById("story-help").style.display = "none";
        }
    },
    levels: [
        "1",
        "2",
        "3",
        "4",
        function (done: () => void) {
            prompt("Введите ваше имя:", "Аноним");
            done()
        },
        {
            img: "angelina",
            name: "Дерево-тян",
            setup: function () {
                board.hp.set(100);
                board.shapes = ["O", "I"];
            },
        },
        {
            img: "charles",
            name: "Чарльз",
            setup: function () {
                board.rotation = "left";
                board.hp.set(200);
                board.selfMovement = true;
            },
        }
    ],
}

story.start();

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
    if (!pause) {
        board.update();
        renderer.render(scene, camera);
    }
    stats.end();
    if (story.inBattle)
        requestAnimationFrame(animate);
    else
        renderer.clear();
}

function onkeydown(event: KeyboardEvent) {
    switch (event.key) {
        case "ArrowUp":
        case " ":
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
