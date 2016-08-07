import {
    Object3D,
    MeshPhongMaterial,
    Mesh,
    BoxBufferGeometry,
} from "three";
import { default as Tetrimino, TetriminoShape } from "tetrimino";
import { story, scene, renderer } from "main"

export default class Board {
    public object: Object3D;
    public speed = 1;
    public current: Tetrimino;
    public next: Tetrimino;
    public gameOver = false;
    public speedUp = false;
    public matrix: Object3D[][];
    public level = 1;
    public score = 0;
    public rotation = "";
    public selfMovement = false;
    public hp = {
        max: 0,
        current: 0,
        set: function (hp: number) {
            this.current = this.max = hp;
            this.update();
        },
        update: function () {
            let hpBar = document.getElementById("enemy-hp");
            let current = hpBar.firstElementChild as HTMLElement;
            current.style.width = this.current / this.max * 100 + "%";
            let text = hpBar.lastElementChild as HTMLElement;
            text.textContent = this.current + " / " + this.max;
        }
    }
    public shapes: TetriminoShape[];

    static maxSpeed = Tetrimino.size / 2;

    constructor(public width = 10, public height = 16) {
        this.matrix = _.range(0, height).map(y => _.range(0, width).map(_.constant(null)));
        this.object = new Object3D();
        var material = new MeshPhongMaterial({ color: 0x222222, side: THREE.DoubleSide });

        let depth = 8;
        let backPlane = new BoxBufferGeometry(
            width * Tetrimino.size + depth,
            height * Tetrimino.size,
            depth
        );
        let back = new Mesh(backPlane, material)
        back.position.x = -depth / 2;
        back.position.z = -Tetrimino.size / 2;
        this.object.add(back);

        // let rightPlane = new BoxBufferGeometry(
        //     Tetrimino.size + depth,
        //     height * Tetrimino.size + depth / 2,
        //     depth
        // );
        // let right = new Mesh(rightPlane, material);
        // right.rotation.y = Math.PI / 2;
        // right.position.set(this.getWidth() / 2, -depth / 2, Tetrimino.size / 2);
        // this.object.add(right);

        let bottomPlane = new BoxBufferGeometry(
            width * Tetrimino.size + depth,
            depth,
            Tetrimino.size
        );
        let bottom = new Mesh(bottomPlane, material);
        bottom.position.set(-depth / 2, this.getBottomY() - depth / 2, -depth / 2);
        this.object.add(bottom);
    }

    public reset() {
        this.selfMovement = false;
        this.shapes = Tetrimino.getShapes();
        this.rotation = "";
        this.gameOver = false;
        this.speed = 1;
        this.score = 0;
        if (this.current) {
            this.object.remove(this.current.object);
            this.current = null;
        }
        this.matrix.forEach((row, y) => {
            row.forEach((node, x) => {
                if (node) {
                    this.object.remove(node)
                    this.matrix[y][x] = null;
                }
            })
        });
    }

    public update() {
        this.updateRotation();
        if (this.gameOver) {
            return;
        }
        if (this.current) {
            let done = this.updateCurrent();
            if (done)
                return
        }
        if (!this.canSpawn()) {
            this.gameOver = true;
            document.body.classList.add("in-game-over");
            document.body.onkeydown = function (event) {
                if (event.key == " ") {
                    document.body.classList.remove("in-game-over");
                    story.endBattle(false);
                }
            }
            return;
        }
        this.speedUp = false;
        this.current = this.spawn();
        this.next = this.spawnNext();
        this.object.position.x = 0;
    }

    private updateRotation() {
        const boardRotation = 0.01;
        switch (this.rotation) {
            case "left":
                if (this.object.rotation.y > Math.PI / 4)
                    this.rotation = "right";
                this.object.rotation.y += boardRotation;
                break;
            case "right":
                if (this.object.rotation.y < -Math.PI / 4)
                    this.rotation = "left";
                this.object.rotation.y -= boardRotation;
                break;
        }
    }

    private canSpawn(): boolean {
        return this.matrix[0].every(_.isNull);
    }

    public updateCurrent(): boolean {
        let tetrimino = this.current;
        let speed = (this.speedUp) ? Board.maxSpeed : this.speed;
        let bottomY = tetrimino.getBottomY() - speed;
        if (bottomY <= this.getBottomY()) {
            this.occupy(tetrimino, this.getBottomY());
            return false;
        }

        let collision = this.detectCollision(tetrimino, speed);
        if (collision) {
            this.occupy(tetrimino, Math.round(bottomY / Tetrimino.size) * Tetrimino.size);
            return false;
        }
        tetrimino.object.position.y -= speed;
        return true;
    }

    public spawnNext() {
        let shapes = this.shapes;
        let shape = shapes[_.random(0, shapes.length - 1)];
        let tetrimino = new Tetrimino(shape);
        let object = tetrimino.object;
        let size = renderer.getSize();
        object.position.x = size.width / 2 - 85;
        object.position.y = size.height / 2 - 170;
        let scale = 0.75;
        object.scale.set(scale, scale, scale);
        scene.add(object);
        return tetrimino;
    }

    public detectCollision(tetrimino: Tetrimino, dy: number = 0, dx: number = 0): boolean {
        let topY = tetrimino.getTopY() - dy;
        let leftX = tetrimino.getLeftX() - dx;

        let startX = leftX / Tetrimino.size + this.width / 2;
        let startY = Math.max(0, this.height / 2 - Math.floor(topY / Tetrimino.size));

        let self = this;
        return tetrimino.matrix.some(function (row, y) {
            return row.some(function (node, x) {
                let dy = Math.min(self.height - 1, startY + y);
                let dx = startX + x;
                return node && self.matrix[dy][dx] != null;
            });
        });
    }

    public occupy(tetrimino: Tetrimino, setBottomY: number) {
        tetrimino.object.position.y = setBottomY + tetrimino.getHeight() / 2;

        let startX = tetrimino.getLeftX() / Tetrimino.size + this.width / 2;
        let startY = Math.round(this.height / 2 - tetrimino.getTopY() / Tetrimino.size);
        for (let y = 0; y < tetrimino.matrix.length; y++) {
            for (let x = 0; x < tetrimino.matrix[0].length; x++) {
                let dy = Math.min(this.height - 1, startY + y);
                let dx = startX + x;
                if (tetrimino.matrix[y][x] == 0) {
                    continue;
                }
                if (dy < 0)
                    continue;
                let object = new Mesh(tetrimino.geometry, tetrimino.material);
                object.position.x = dx * Tetrimino.size - (this.getWidth() - Tetrimino.size) / 2;
                object.position.y = this.getTopY() - dy * Tetrimino.size - Tetrimino.size / 2;
                this.matrix[dy][dx] = object;
                this.object.add(object);
            }
        }
        this.object.remove(tetrimino.object);
        this.clearFullRows();
    }

    public clearFullRows() {
        let cleared = 0;
        for (let y = this.matrix.length - 1; y >= 0;) {
            let row = this.matrix[y];
            if (_.includes(row, null)) {
                y--;
                continue;
            }
            cleared++;
            row.forEach((object, x) => {
                this.object.remove(object);
                this.matrix[y][x] = null;
            });
            for (let dy = y; dy > 0; dy--) {
                this.matrix[dy - 1].forEach((object, x) => {
                    if (object) {
                        this.matrix[dy - 1][x] = null;
                        this.matrix[dy][x] = object;
                        object.position.y -= Tetrimino.size;
                    }
                })
            }
        }
        if (cleared > 0) {
            this.addScore(10 * cleared);
            this.updateLevel();
        }
    }

    private addScore(score: number) {
        this.score += score;
        document.getElementById("score").textContent = this.score.toString();
        this.hp.current -= score;
        this.hp.update()

        if (this.hp.current <= 0) {
            this.gameOver = true;
            document.body.classList.add("in-victory");
            document.body.onkeydown = function (event) {
                if (event.key == " ") {
                    document.body.classList.remove("in-victory");
                    story.endBattle(true);
                }
            }
        }
    }

    private updateLevel() {
        const scorePerLevel = 100;
        if (this.score > 0 && this.score % scorePerLevel == 0) {
            let level = this.score / scorePerLevel;
            if (this.level != level) {
                this.level = level;
                this.speed = Math.min(level, Board.maxSpeed);
                document.getElementById("level").textContent = this.level.toString();
            }
        }

    }

    public spawn() {
        let tetrimino = this.next || this.spawnNext();
        if (Math.random() > 0.5) {
            tetrimino.rotate()
        }

        let object = tetrimino.object;
        object.scale.set(1, 1, 1);
        this.object.add(object);
        object.position.y = this.getTopY() + tetrimino.getHeight() / 2;
        object.position.x = (this.getWidth() - tetrimino.getWidth()) / 2 % Tetrimino.size;

        return tetrimino;
    }

    public getTopY() {
        return this.height / 2 * Tetrimino.size;

    }

    public getBottomY() {
        return -this.getTopY();
    }

    public getWidth() {
        return this.width * Tetrimino.size;
    }

    public getHeight() {
        return this.height * Tetrimino.size;
    }

    public moveCurrentLeft() {
        let noBorder = this.current.getLeftX() > -this.getWidth() / 2;
        let collision = this.detectCollision(this.current, 0, Tetrimino.size);
        if (noBorder && !collision) {
            this.current.object.position.x -= Tetrimino.size;
            if (this.selfMovement)
                this.object.position.x += Tetrimino.size;
        }
    }

    public moveCurrentRight() {
        let noBorder = this.current.getRightX() < this.getWidth() / 2;
        let collision = this.detectCollision(this.current, 0, -Tetrimino.size);
        if (noBorder && !collision) {
            this.current.object.position.x += Tetrimino.size;
            if (this.selfMovement)
                this.object.position.x -= Tetrimino.size;
        }
    }

    public rotateCurrent() {
        this.current.rotate();
        let maxX = this.getWidth() / 2;
        if (this.current.getRightX() > maxX) {
            this.current.object.position.x = maxX - this.current.getWidth() / 2;
        }
        let minX = -maxX;
        if (this.current.getLeftX() < minX) {
            this.current.object.position.x = minX + this.current.getWidth() / 2;
        }
    }
}
