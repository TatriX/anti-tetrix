import {
    Object3D,
    MeshPhongMaterial,
    Mesh,
    BoxBufferGeometry,
} from "three";
import { default as Tetrimino, TetriminoShape } from "tetrimino";
import { story, scene, renderer } from "main"
import Hp from "hp";

export default class Board {
    public object: Object3D;
    public speed = 1;
    public current: Tetrimino;
    public next: Tetrimino;
    public gameOver = false;
    public speedUp = false;
    public moveLeft = false;
    public moveRight = false;
    public matrix: Object3D[][];
    public level = 1;
    public score = 0;
    public totalScore = 0;
    public rotation = "";
    public reel = "";
    public selfMovement = false;

    public glowstick = false;
    public randomize = false;
    public mustBeFast = false;

    private hp = {
        player: new Hp("player-hp"),
        enemy: new Hp("enemy-hp"),
    }

    public shapes: TetriminoShape[];

    private spawned = 0;

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
        bottom.position.set(0, this.getBottomY() - depth / 2, -depth / 2);
        this.object.add(bottom);
    }

    public setHp(max: number) {
        this.hp.player.set(max);
        this.hp.enemy.set(max);
    }

    public reset() {
        this.mustBeFast = false;
        this.selfMovement = false;
        this.shapes = Tetrimino.getDefaultShapes();
        this.rotation = "";
        this.reel = "";
        this.object.rotation.set(0, 0, 0);
        this.gameOver = false;
        this.speed = 1;
        this.score = 0;
        this.spawned = 0;
        if (this.current) {
            this.object.remove(this.current.object);
            this.current = null;
        }
        if (this.next) {
            scene.remove(this.next.object);
            this.next = null;
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

    private lastDmg = 0;
    public update() {
        this.updateRotation();
        if (this.gameOver) {
            return;
        }
        if (this.current) {
            let done = this.updateCurrent();
            if (done || this.gameOver)
                return
        }
        if (!this.canSpawn()) {
            this.lose();
            return;
        }


        let forceDmg = false;
        if (this.mustBeFast) {
            let now = Date.now()
            if (now - this.lastDmg > 2222) {
                this.lastDmg = now;
                forceDmg = true;
            }

        }
        if ((this.spawned > 0 && this.spawned % 5 == 0) || forceDmg) {
            let dmg = _.random(5, 15);
            this.hp.player.dec(dmg);
            this.drawDamage("player-hp", dmg);
            if (this.hp.player.dead()) {
                this.lose();
                return;
            }
        }
        this.speedUp = false;
        this.current = this.spawn();
        this.next = this.spawnNext();
        this.object.position.x = 0;
    }

    private lose() {
        this.gameOver = true;
        document.body.classList.add("in-game-over");
        document.body.onkeydown = function (event) {
            if (event.key == " ") {
                document.body.classList.remove("in-game-over");
                story.endBattle(false);
            }
        }
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
        switch (this.reel) {
            case "up":
                if (this.object.rotation.z > Math.PI / 8)
                    this.reel = "down";
                this.object.rotation.z += boardRotation;
                break;
            case "down":
                if (this.object.rotation.z < -Math.PI / 8)
                    this.reel = "up";
                this.object.rotation.z -= boardRotation;
                break;
        }
    }

    private canSpawn(): boolean {
        return this.matrix[0].every(_.isNull);
    }

    public updateCurrent(): boolean {
        this.updateMovement();
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
        let shape = (this.glowstick)
            ? "I" as TetriminoShape
            : this.shapes[_.random(0, this.shapes.length - 1)];
        let tetrimino = new Tetrimino(shape);
        if (Math.random() > 0.5) {
            tetrimino.rotate()
        }
        let object = tetrimino.object;
        let size = renderer.getSize();
        object.position.x = size.width / 2 - 85;
        object.position.y = size.height / 2 - 200;
        let scale = 0.75;
        object.scale.set(scale, scale, scale);
        scene.add(object);
        return tetrimino;
    }

    public detectCollision(tetrimino: Tetrimino, dy: number = 0, dx: number = 0): boolean {
        let topY = tetrimino.getTopY() - dy;
        let leftX = tetrimino.getLeftX() - dx;

        let startX = Math.floor(leftX / Tetrimino.size + this.width / 2);
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
                // collision detection bug hackfix
                if (this.matrix[dy][dx] != null) {
                    continue;
                }
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
            let score = 10 * cleared + 5 * (cleared - 1);
            this.addScore(score);
            this.updateLevel();
        }
    }

    public setTotalScore(score: number) {
        this.totalScore = score;
        document.getElementById("total-score").textContent = this.totalScore.toString();
    }

    private addScore(score: number) {
        this.score += score;
        document.getElementById("score").textContent = this.score.toString();
        this.setTotalScore(this.totalScore + score)
        this.hp.enemy.dec(score);

        this.drawDamage("enemy-hp", score);

        if (this.hp.enemy.dead()) {
            this.win();
        }
    }

    private drawDamage(selector: string, dmg: number) {
        let elem = document.createElement("i");
        elem.className = "dmg";
        elem.textContent = (-dmg).toString();
        let parent = document.getElementById(selector);
        parent.appendChild(elem);
        _.defer(function () {
            elem.classList.add("animate");
        });
        setTimeout(function () {
            parent.removeChild(elem);
        }, 2000);
    }

    public win() {
        this.gameOver = true;
        document.body.classList.add("in-victory");
        document.body.onkeydown = function (event) {
            if (event.key == " ") {
                document.body.classList.remove("in-victory");
                story.endBattle(true);
            }
        }

    }

    private updateLevel() {
        const scorePerLevel = 100;
        let level = Math.floor(this.score / scorePerLevel) + 1;
        if (this.level != level) {
            this.level = level;
            this.speed = Math.min(level, Board.maxSpeed);
            document.getElementById("level").textContent = this.level.toString();
        }
    }

    public spawn() {
        this.spawned++;
        let tetrimino = this.next || this.spawnNext();
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

    private lastMove = 0;
    private updateMovement() {
        let now = Date.now()
        if (now - this.lastMove < 100) {
            return;
        }

        if (this.randomize && Math.random() < 0.01) {
            this.object.rotation.x = Math.PI / _.random(12, 24);
            this.object.rotation.y = -Math.PI / _.random(12, 24);
        }

        if (this.moveLeft) {
            if (this.randomize && Math.random() < 0.1)
                this.moveCurrentRight();
            else
                this.moveCurrentLeft();
        } else if (this.moveRight) {
            if (this.randomize && Math.random() < 0.1)
                this.moveCurrentLeft();
            else
                this.moveCurrentRight();
        } else {
            return;
        }
        this.lastMove = now;
    }

    private moveCurrentLeft() {
        let noBorder = this.current.getLeftX() > -this.getWidth() / 2;
        let collision = this.detectCollision(this.current, 0, Tetrimino.size);
        if (noBorder && !collision) {
            this.current.object.position.x -= Tetrimino.size;
            if (this.selfMovement)
                this.object.position.x += Tetrimino.size;
        }
    }

    private moveCurrentRight() {
        let noBorder = this.current.getRightX() < this.getWidth() / 2;
        let collision = this.detectCollision(this.current, 0, -Tetrimino.size);
        if (noBorder && !collision) {
            this.current.object.position.x += Tetrimino.size;
            if (this.selfMovement)
                this.object.position.x -= Tetrimino.size;
        }
    }

    public rotateCurrent() {
        let done = this.current.rotate(() => this.detectCollision(this.current) == false);
        if (!done)
            return;
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
