import Input from "./Input.js";
import { prng, Vector2 } from "./Util.js";

class Board {
    /** @type {Number} */
    static bombChance = 0.2;
    constructor(seed) {
        /** @type {Object} */
        this.board = {};
        this.seed = seed;
        this.score = 0;
        this.initialTile = null;
        window.a = this;
    }
    static getAddress(x, y) { return `${x},${y}`; }
    exists(x, y) { return this.board.hasOwnProperty(Board.getAddress(x, y)) }

    get(x, y) {
        if (!this.exists(x, y)) this.generate(x, y);
        return this.board[Board.getAddress(x, y)];
    }
    set(x, y, value) {
        if (!this.exists(x, y)) this.board[Board.getAddress(x, y)] = value;
        else Object.assign(this.board[Board.getAddress(x, y)], value);
        for(let xx = x - 1; xx <= x + 1; xx++) {
            for(let yy = y - 1; yy <= y + 1; yy++) {
                this.update(xx, yy);
            }
        }
    }
    generate(x, y) {
        if (this.exists(x, y)) return;
        this.set(x, y, {
            value: prng(x * 1000 + y, this.seed) < Board.bombChance ? -1 : 0,
            covered: true,
            flagState: 0,
        });
    }
    update(x, y) {
        if (this.exists(x, y) && this.get(x, y).value > -1) {
            let adjacentBombs = 0;
            for (let xx = x - 1; xx <= x + 1; xx++) {
                for (let yy = y - 1; yy <= y + 1; yy++) {
                    if (this.exists(xx, yy) && this.board[Board.getAddress(xx, yy)].value === -1) adjacentBombs++;
                }
            }
            this.board[Board.getAddress(x, y)].value = adjacentBombs;
        }
    }

    draw(g, camera) {
        g.fillStyle = "#000";
        for (let x = Math.floor(camera.position.x); x <= camera.position.x + window.innerWidth / camera.tilesize; x++) {
            for (let y = Math.floor(camera.position.y); y <= camera.position.y + window.innerHeight / camera.tilesize; y++) {
                const tile = this.get(x, y);
                if (!tile.covered) {
                    g.fillStyle = (x + y) % 2 === 0 ? "#AAD650" : "#A2D048";
                    g.fillRect(
                        Math.round((x - camera.position.x) * camera.tilesize),
                        Math.round((y - camera.position.y) * camera.tilesize),
                        camera.tilesize, camera.tilesize
                    );
                } else {
                    g.fillStyle = (x + y) % 2 === 0 ? "#D7B998" : "#E4C29E";
                    g.fillRect(
                        Math.round((x - camera.position.x) * camera.tilesize),
                        Math.round((y - camera.position.y) * camera.tilesize),
                        camera.tilesize, camera.tilesize
                    );
                    if (tile.value > 0) {
                        g.fillStyle = {
                            1: "#1977D3",
                            2: "#3B8E3F",
                            3: "#D53734",
                            4: "#7A1EA2",
                            5: "#FF8F00",
                            6: "#159AA4",
                            7: "#434343",
                            8: "#A99D93",
                        }[tile.value];
                        const metrics = g.measureText(tile.value);
                        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
                        g.font = `${camera.tilesize / (64 / 48)}px roboto`;
                        g.fillText(tile.value,
                            (x - camera.position.x + 0.5) * camera.tilesize -
                                    metrics.width / 2,
                            (y - camera.position.y + 0.5) * camera.tilesize + textHeight * 0.5,
                            camera.tilesize
                        );
                    } else if (tile.value === -1) {
                        g.fillStyle = "#000";
                        g.fillRect(
                            Math.round((x - camera.position.x) * camera.tilesize),
                            Math.round((y - camera.position.y) * camera.tilesize),
                            camera.tilesize, camera.tilesize
                        );
                    }
                }
            }
        }
    }

    findInitialTile() {
        let index = 0;
        while (!this.initialTile) {
            let adjacentBlanks = 0;
            for(let y = -1; y <= 1; y++) for(let x = index - 1; x <= index + 1; x++) {
                this.generate(x, y);
                if (this.get(x, y).value === 0) adjacentBlanks++;
            }
            this.update(index, 0);
            if (this.get(index, 0).value === 0) this.initialTile = new Vector2(index, 0);
            index++;
        }
        return this.initialTile;
    }

    snapToInitialTile(camera) {
        if (this.initialTile) {
            camera.position.x = this.initialTile.x - Math.round(Input.mouse.position.x / camera.tilesize) + 0.5;
            camera.position.y = this.initialTile.y - Math.round(Input.mouse.position.y / camera.tilesize) + 0.5;
        }
    }
}

export default Board;