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
board.setTotalScore(storage.get("totalScore") || 0);
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

interface Cutscene {
    (done: () => void): void;
}

type Level = string | Cutscene | Enemy;

class Story {
    public elem = document.getElementById("story");
    public index = storage.get("story") || 0;
    public inBattle = false;

    public start() {
        this.load();
    }

    public loadStory(name: Level) {
        xhr("story/" + name + ".html", (html: string) => {
            this.elem.innerHTML = html;
            document.getElementById("story-help").onclick = this.load.bind(this);
            document.body.onkeydown = this.onkeydown.bind(this);
            document.body.onkeyup = null;
        });
    }

    public startBattle(enemy: Enemy) {
        scene.rotation.x = 0;
        scene.rotation.y = 0;
        board.reset();
        enemy.setup();
        this.inBattle = true;
        this.elem.style.display = "none";
        document.body.classList.remove("in-story");
        document.body.classList.add("in-battle");

        document.getElementById("enemy").innerHTML = "<img src=assets/" + enemy.img + ".png>" +
            "<span>" + enemy.name + "</span>";
        document.body.onkeydown = onkeydown;
        document.body.onkeyup = onkeyup;
        animate();
    }

    public endBattle(win: boolean) {
        this.inBattle = false;
        this.elem.style.display = "block";
        this.elem.innerHTML = "";
        document.body.classList.remove("in-battle");
        document.body.classList.add("in-story");
        document.getElementById("enemy").innerHTML = "";
        if (win) {
            storage.set("totalScore", board.totalScore);
            this.index++;
            this.load();
        } else {
            this.loadStory("lose");
        }
    }

    public onkeydown(event: KeyboardEvent) {
        if (event.key == " ") {
            this.load()
        }
    }

    public load() {
        storage.set("story", this.index);
        let level = Story.levels[this.index];
        switch (typeof level) {
            case "string":
                this.index++;
                this.loadStory(level);
                break;
            case "function":
                let cutscene = level as Cutscene;
                cutscene(() => {
                    this.index++;
                    this.load()
                });
                break;
            case "object":
                let enemy = level as Enemy;
                this.startBattle(enemy);
                break;
            default:
                this.loadStory("win");
                document.getElementById("story-help").style.display = "none";
        }
    }

    static levels: Level[] = [
        "intro-1",
        "intro-2",
        "intro-3",
        "intro-4",
        function (done: () => void) {
            prompt("Введите ваше имя:", "Аноним");
            done()
        },
        "derevo-tyan",
        {
            img: "derevo-tyan",
            name: "Дерево-тян",
            setup: function () {
                board.setHp(100);
                board.shapes = ["O", "I"];
            },
        },
        "easy-win",
        "charles",
        {
            img: "charles",
            name: "Чарльз",
            setup: function () {
                board.setHp(150);
            },
        },
        "red-hair",
        {
            img: "red-hair",
            name: "Рыжетян",
            setup: function () {
                board.setHp(200);
                board.shapes = Tetrimino.getShapes();
                board.object.rotation.x = Math.PI / 24;
                board.object.rotation.y = -Math.PI / 12;
            },
        },
        "zero",
        {
            img: "zero",
            name: "20 лет с нульчика-кун",
            setup: function () {
                board.setHp(250);
                board.rotation = "left";
            },
        },
        "codejam",
        {
            img: "codejam",
            name: "Джем. Код Джем.",
            setup: function () {
                board.setHp(300);
                board.randomize = true;
            },
        },
        "avatar",
        {
            img: "avatar",
            name: "Абатурка",
            setup: function () {
                board.setHp(350);
                board.shapes = Tetrimino.getShapes();
                board.selfMovement = true;
            },
        },
        "level",
        {
            img: "level",
            name: "Уровень ГГ",
            setup: function () {
                board.setHp(400);
                board.shapes = ["Z", "S", ".", "C", "I"];
                board.rotation = "left";
                board.selfMovement = true;
            },
        },
        "twitter",
        {
            img: "twitter",
            name: "Клиторский-кун",
            setup: function () {
                board.setHp(450);
                board.rotation = "left";
                board.reel = "up";
            },
        },
        "nikita",
        {
            img: "nikita",
            name: "Никита Контент",
            setup: function () {
                board.setHp(500);
                board.shapes = ["I"]
                board.mustBeFast = true;
            },
        },
        "tetrix",
        {
            img: "tetrix",
            name: "Тетрикс",
            setup: function () {
                board.setHp(666);
            },
        }
    ];
}

export let story = new Story();
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
            board.moveLeft = true;
            break;
        case "ArrowRight":
            board.moveRight = true;
            break;
        case "Escape":
            pause = !pause;
            break;
    }
}

let cheatcode = {
    code: "",
    add: function (key: string) {
        if (key.match(/^\w$/)) {
            this.code += key;
            switch (this.code) {
                case "abu":
                    board.win();
                    break;
                case "glowstick":
                    board.glowstick = !board.glowstick;
                    break;
            }
        } else {
            this.code = "";
        }
    }
}

function onkeyup(event: KeyboardEvent) {
    switch (event.key) {
        case "ArrowDown":
            board.speedUp = false;
            break;
        case "ArrowLeft":
            board.moveLeft = false;
            break;
        case "ArrowRight":
            board.moveRight = false;
            break;

        default:
            cheatcode.add(event.key);
    }
}
