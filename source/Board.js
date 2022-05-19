import { prng, Vector2, Input, Image } from "./Util.js";
import Settings from "./Settings.js";

class Board {
    /** @type {Number} */
    static bombChance = 0.2;
    constructor(seed, camera, boardControls) {
        /** @type {Object} */
        this.board = {};
        this.seed = seed ?? (Math.random() - 0.5) * 2500;
        this.score = 0;
        this.initialTile = null;
        this.boardControls = boardControls ?? false;
        this.camera = camera ?? null;

        this.leftToEmpty = [];
        
        this.initializeControls();
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

    draw(g) {
        g.fillStyle = "#000";
        const camera = this.camera;
        for (let x = Math.floor(camera.position.x); x <= camera.position.x + window.innerWidth / camera.tilesize; x++) {
            for (let y = Math.floor(camera.position.y); y <= camera.position.y + window.innerHeight / camera.tilesize; y++) {
                const tile = this.get(x, y);
                if (tile.covered) {
                    g.fillStyle = (x + y) % 2 === 0 ? "#AAD650" : "#A2D048";
                    g.fillRect(
                        Math.round((x - camera.position.x) * camera.tilesize),
                        Math.round((y - camera.position.y) * camera.tilesize),
                        camera.tilesize, camera.tilesize
                    );
                    if (tile.flagState > 0) {
                        g.drawImage(
                            Image.get("flag"),
                            Math.round((x - camera.position.x) * camera.tilesize),
                            Math.round((y - camera.position.y) * camera.tilesize),
                            camera.tilesize, camera.tilesize
                        );
                    }
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
                        g.font = `bold ${camera.tilesize / (64 / 48)}px roboto`;
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
                    if (Settings.settings.drawBorders) {
                        g.strokeStyle = g.fillStyle = "#86AE3A";
                        g.lineWidth = camera.tilesize / (64 / 15) / 2;
                        g.beginPath();
                        const condition = (xx, yy) => this.get(x, y).value !== -1 && (this.get(xx, yy).covered || this.get(xx, yy).value === -1);
                        if (condition(x + 1, y)) { // Right
                            g.moveTo(
                                Math.round((x - camera.position.x + 1) * camera.tilesize - g.lineWidth / 2),
                                Math.round((y - camera.position.y) * camera.tilesize)
                            );
                            g.lineTo(
                                Math.round((x - camera.position.x + 1) * camera.tilesize - g.lineWidth / 2),
                                Math.round((y - camera.position.y + 1) * camera.tilesize)
                            );
                        }
                        if (condition(x - 1, y)) { // Left
                            g.moveTo(
                                Math.round((x - camera.position.x) * camera.tilesize + g.lineWidth / 2),
                                Math.round((y - camera.position.y) * camera.tilesize)
                            );
                            g.lineTo(
                                Math.round((x - camera.position.x) * camera.tilesize + g.lineWidth / 2),
                                Math.round((y - camera.position.y + 1) * camera.tilesize)
                            );
                        }
                        if (condition(x, y + 1)) { // Bottom
                            g.moveTo(
                                Math.round((x - camera.position.x) * camera.tilesize),
                                Math.round((y - camera.position.y + 1) * camera.tilesize - g.lineWidth / 2)
                            );
                            g.lineTo(
                                Math.round((x - camera.position.x + 1) * camera.tilesize),
                                Math.round((y - camera.position.y + 1) * camera.tilesize - g.lineWidth / 2)
                            );
                        }
                        if (condition(x, y - 1)) { // Top
                            g.moveTo(
                                Math.round((x - camera.position.x) * camera.tilesize),
                                Math.round((y - camera.position.y) * camera.tilesize + g.lineWidth / 2)
                            );
                            g.lineTo(
                                Math.round((x - camera.position.x + 1) * camera.tilesize),
                                Math.round((y - camera.position.y) * camera.tilesize + g.lineWidth / 2)
                            );
                        }
                        g.stroke();
                        if (condition(x - 1, y - 1)) g.fillRect( // Top Left
                            (x - camera.position.x) * camera.tilesize,
                            (y - camera.position.y) * camera.tilesize,
                            g.lineWidth, g.lineWidth
                        );
                        if (condition(x + 1, y - 1)) g.fillRect( // Top Right
                            (x - camera.position.x + 1) * camera.tilesize - g.lineWidth,
                            (y - camera.position.y) * camera.tilesize,
                            g.lineWidth, g.lineWidth
                        );
                        if (condition(x - 1, y + 1)) g.fillRect( // Bottom Left
                            (x - camera.position.x) * camera.tilesize,
                            (y - camera.position.y + 1) * camera.tilesize - g.lineWidth,
                            g.lineWidth, g.lineWidth
                        );
                        if (condition(x + 1, y + 1)) g.fillRect( // Bottom Right
                            (x - camera.position.x + 1) * camera.tilesize - g.lineWidth,
                            (y - camera.position.y + 1) * camera.tilesize - g.lineWidth,
                            g.lineWidth, g.lineWidth
                        );
                    }
                }
            }
        }
        for(let _ = 0; _ < Settings.settings.animateTileReveal_t; _++) if (this.leftToEmpty.length > 0) {
            const tileX = parseInt(this.leftToEmpty[0].split(",")[0]);
            const tileY = parseInt(this.leftToEmpty[0].split(",")[1]);
            for (let xx = tileX - 1; xx <= tileX + 1; xx++) {
                for (let yy = tileY - 1; yy <= tileY + 1; yy++) {
                    if (this.get(xx, yy).covered && this.get(tileX, tileY).value === 0 && !this.leftToEmpty.includes(`${xx},${yy}`)) this.leftToEmpty.push(`${xx},${yy}`);
                }
            }
            this.set(tileX, tileY, { "covered": false, });
            this.score++;
            this.leftToEmpty.splice(0, 1);
        }
    }

    findInitialTile() {
        let index = 0;
        while (!this.initialTile) {
            for(let y = -1; y <= 1; y++) for(let x = index - 1; x <= index + 1; x++) this.generate(x, y);
            this.update(index, 0);
            if (this.get(index, 0).value === 0) this.initialTile = new Vector2(index, 0);
            index++;
        }
        return this.initialTile;
    }

    snapToInitialTile() {
        if (this.initialTile) {
            this.camera.position.x = this.initialTile.x - Math.floor(Input.mouse.position.x / this.camera.tilesize);
            this.camera.position.y = this.initialTile.y - Math.floor(Input.mouse.position.y / this.camera.tilesize);
        }
    }

    initializeControls() {
        const dig = (x, y) => {
            if (!this.get(x, y).covered || this.get(x, y).flagState > 0) return;
            this.leftToEmpty.push(`${x},${y}`);

            if (Settings.settings.animateTileReveal) while (this.leftToEmpty.length > 0) {
                const tileX = parseInt(this.leftToEmpty[0].split(",")[0]);
                const tileY = parseInt(this.leftToEmpty[0].split(",")[1]);
                for (let xx = tileX - 1; xx <= tileX + 1; xx++) {
                    for (let yy = tileY - 1; yy <= tileY + 1; yy++) {
                        if (this.get(xx, yy).covered && this.get(tileX, tileY).value === 0 && !this.leftToEmpty.includes(`${xx},${yy}`)) this.leftToEmpty.push(`${xx},${yy}`);
                    }
                }
                this.set(tileX, tileY, { "covered": false, });
                this.score++;
                this.leftToEmpty.splice(0, 1);
            };
        }
        const toggleFlag = (x, y) => {
            if (!this.get(x, y).covered) return;
            this.set(x, y, { "flagState": 1 - this.get(x, y).flagState });
        };

        window.addEventListener("mouseup", (event) => {
            if (!this.boardControls) return;
            const x = Math.floor(this.camera.position.x + Input.mouse.position.x / this.camera.tilesize);
            const y = Math.floor(this.camera.position.y + Input.mouse.position.y / this.camera.tilesize);
            if (event.button === 0) dig(x, y);
            if (event.button === 2) toggleFlag(x, y);
        });
    }
}

export default Board;