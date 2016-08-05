import {
    Color,
    Object3D,
    Mesh,
    MeshBasicMaterial,
    BoxBufferGeometry,
} from "three";

import { debug } from "main";

export type TetriminoShape = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

interface TetriminoShapes {
    [id: string]: {
        color: number;
        matrix: number[][];
    }
}

export default class Tetrimino {
    public color: Color;
    public object: Object3D;
    public geometry: BoxBufferGeometry;
    public material: MeshBasicMaterial;
    public matrix: number[][];
    static size = 40;

    constructor(public shape: TetriminoShape) {
        let {color, matrix} = Tetrimino.shapes[shape];
        this.matrix = matrix;
        this.geometry = new BoxBufferGeometry(Tetrimino.size, Tetrimino.size, Tetrimino.size)
        this.material = new MeshBasicMaterial({ color, wireframe: true });
        this.object = new Object3D();
        this.initObject();
    }

    private addCenterDot() {
        let dot = new Mesh(
            new BoxBufferGeometry(5, 5, 5),
            new MeshBasicMaterial({ color: 0xffffff })
        );
        this.object.add(dot);
    }

    public getWidth() {
        return this.matrix[0].length * Tetrimino.size;
    }

    public getHeight() {
        return this.matrix.length * Tetrimino.size;
    }

    public getLeftX() {
        return this.object.position.x - this.getWidth() / 2;
    }

    public getRightX() {
        return this.object.position.x + this.getWidth() / 2;
    }

    public getTopY() {
        return this.object.position.y + this.getHeight() / 2;
    }

    public getBottomY() {
        return this.object.position.y - this.getHeight() / 2;
    }

    public rotate() {
        let x = this.getLeftX();
        this.matrix = _.zip.apply(_, this.matrix).map(_.reverse);
        let children = this.object.children;
        for (let i = children.length; i >= 0; i--) {
            this.object.remove(children[i]);
        }
        this.initObject();
        let delta = (x - this.getLeftX()) % Tetrimino.size;
        this.object.position.x += delta;
    }

    private initObject() {
        let width = this.getWidth();
        let height = this.getHeight();
        this.matrix.forEach((row, y) => {
            row.forEach((node, x) => {
                if (!node)
                    return;
                let mesh = new Mesh(this.geometry, this.material);
                mesh.position.x = Tetrimino.size * x - (width - Tetrimino.size) / 2;
                mesh.position.y = -Tetrimino.size * y + (height - Tetrimino.size) / 2;
                this.object.add(mesh);
            })
        });
        if (debug)
            this.addCenterDot();
    }

    static getShapes() {
        // TODO: use static list?
        return Object.keys(Tetrimino.shapes) as TetriminoShape[];
    }

    private static shapes: TetriminoShapes = {
        "I": {
            color: 0x00ffff,
            matrix: [
                [1, 1, 1, 1]
            ],
        },
        "J": {
            color: 0x0000ff,
            matrix: [
                [1, 1, 1],
                [0, 0, 1],
            ],
        },
        "L": {
            color: 0xffa500,
            matrix: [
                [1, 1, 1],
                [1, 0, 0],
            ],
        },
        "O": {
            color: 0xffff00,
            matrix: [
                [1, 1],
                [1, 1]
            ],
        },
        "S": {
            color: 0x00ff00,
            matrix: [
                [0, 1, 1],
                [1, 1, 0],
            ]
        },
        "T": {
            color: 0xaa00ff,
            matrix: [
                [1, 1, 1],
                [0, 1, 0],
            ]
        },
        "Z": {
            color: 0xff0000,
            matrix: [
                [1, 1, 0],
                [0, 1, 1],
            ]
        }
    };
}
