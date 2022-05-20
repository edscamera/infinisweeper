import { prng, Vector2, Input, Image, SoundEffect } from "./Util.js";
import Settings from "./Settings.js";
import PoppedTile from "./PoppedTile.js";

class Board {
    /** @type {Number} */
    static bombChance = 0.2;
    constructor(seed, camera, boardControls) {
        /** @type {Object} */
        this.board = {};
        this.seed = seed ?? (Math.random() - 0.5) * 2500;
        this.initialTile = null;
        this.boardControls = boardControls ?? false;
        this.camera = camera ?? null;

        this.mode = "normal";

        this.leftToEmpty = [];
        this.colorCorrection = 0;

        this.score = 0;
        this.flags = 0;

        this.leftMost = null;
        this.rightMost = null;
        this.topMost = null;
        this.bottomMost = null;

        this.secondsPlayed = 0;
        this.secondsInterval = window.setInterval(() => {
            if (this.boardControls) {
                this.secondsPlayed++;
                this.updateScoreContainer();
            }
        }, 1000);

        if (!localStorage[`highScore_${this.mode}`]) localStorage[`highScore_${this.mode}`] = 0;

        document.querySelector("#scoreContainer").setAttribute("hide", false);
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
        for (let xx = x - 1; xx <= x + 1; xx++) {
            for (let yy = y - 1; yy <= y + 1; yy++) {
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
        const camera = this.camera;
        for (let x = Math.floor(camera.position.x); x <= camera.position.x + window.innerWidth / camera.tilesize; x++) {
            for (let y = Math.floor(camera.position.y); y <= camera.position.y + window.innerHeight / camera.tilesize; y++) {
                const tile = this.get(x, y);
                if (tile.covered) {
                    g.fillStyle = (x + y + this.colorCorrection) % 2 === 0 ? "#AAD650" : "#A2D048";
                    g.fillRect(
                        Math.round((x - camera.position.x) * camera.tilesize),
                        Math.round((y - camera.position.y) * camera.tilesize),
                        camera.tilesize, camera.tilesize
                    );
                    if (tile.flagState > 0) {
                        if (Settings.settings.animateFlags) {
                            g.drawImage(
                                Image.get("flag_animation"), 1, 81 * tile.flagAnimationFrame, 81, 80,
                                Math.round((x - camera.position.x) * camera.tilesize),
                                Math.round((y - camera.position.y) * camera.tilesize),
                                camera.tilesize, camera.tilesize
                            );
                            if (tile.flagAnimationFrame < 9) this.set(x, y, {
                                "flagAnimationFrame": tile.flagAnimationFrame + 1,
                            });
                        } else {
                            g.drawImage(
                                Image.get("flag"),
                                Math.round((x - camera.position.x) * camera.tilesize),
                                Math.round((y - camera.position.y) * camera.tilesize),
                                camera.tilesize, camera.tilesize
                            );
                        }
                    }
                } else {
                    g.fillStyle = (x + y + this.colorCorrection) % 2 === 0 ? "#D7B998" : "#E4C29E";
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
                        const partialVal = (x - camera.position.x) * (y - camera.position.y);
                        const totalVal = (window.innerWidth / camera.tilesize) * (window.innerHeight / camera.tilesize);
                        g.fillStyle = `hsl(${partialVal / totalVal * 360},100%,50%)`;
                        g.fillRect(
                            Math.round((x - camera.position.x) * camera.tilesize),
                            Math.round((y - camera.position.y) * camera.tilesize),
                            camera.tilesize, camera.tilesize
                        );
                        if (!tile.bombAnimation) this.set(x, y, { "bombAnimation": 255, });
                        this.set(x, y, { "bombAnimation": this.get(x, y).bombAnimation - this.get(x, y).bombAnimation / 150, });
                        g.fillStyle = `rgb(${(this.get(x, y).bombAnimation + ",").repeat(3).slice(0, -1)})`;
                        g.beginPath();
                        g.ellipse(
                            (x - camera.position.x + 0.5) * camera.tilesize,
                            (y - camera.position.y + 0.5) * camera.tilesize,
                            camera.tilesize / 4,
                            camera.tilesize / 4,
                            0, 0, Math.PI * 2
                        );
                        g.fill();
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
        for (let _ = 0; _ < Settings.settings.animateTileReveal_t; _++) if (this.leftToEmpty.length > 0) this.digQueuedTile(0);
    }

    findInitialTile() {
        let index = 0;
        while (!this.initialTile) {
            for (let y = -1; y <= 1; y++) for (let x = index - 1; x <= index + 1; x++) this.generate(x, y);
            this.update(index, 0);
            if (this.get(index, 0).value === 0) this.initialTile = new Vector2(index, 0);
            index++;
        }
        return this.initialTile;
    }

    snapToInitialTile() {
        if (!this.initialTile) this.findInitialTile();
        const d1 = (
            this.camera.position.x + Math.floor(Input.mouse.position.x / this.camera.tilesize) +
            this.camera.position.y + Math.floor(Input.mouse.position.y / this.camera.tilesize)
        ) % 2;
        this.camera.position.x = this.initialTile.x - Math.floor(Input.mouse.position.x / this.camera.tilesize);
        this.camera.position.y = this.initialTile.y - Math.floor(Input.mouse.position.y / this.camera.tilesize);
        const d2 = (
            this.camera.position.x + Math.floor(Input.mouse.position.x / this.camera.tilesize) +
            this.camera.position.y + Math.floor(Input.mouse.position.y / this.camera.tilesize)
        ) % 2;
        this.colorCorrection = Math.round(Math.abs(d1 - d2));
        this.camera.cameraControls = true;
    }

    digQueuedTile(index) {
        const tileX = parseInt(this.leftToEmpty[index].split(",")[0]);
        const tileY = parseInt(this.leftToEmpty[index].split(",")[1]);
        SoundEffect.play(`blip_${this.get(tileX, tileY).value}`);
        for (let xx = tileX - 1; xx <= tileX + 1; xx++) {
            for (let yy = tileY - 1; yy <= tileY + 1; yy++) {
                if (this.get(xx, yy).covered && this.get(tileX, tileY).value === 0 && !this.leftToEmpty.includes(`${xx},${yy}`)) this.leftToEmpty.push(`${xx},${yy}`);
            }
        }
        this.set(tileX, tileY, { "covered": false, });
        if (tileX < this.leftMost) this.leftMost = tileX;
        if (tileX > this.rightMost) this.rightMost = tileX;
        if (tileY < this.topMost) this.topMost = tileY;
        if (tileY > this.bottomMost) this.bottomMost = tileY;
        if (Settings.settings.animateFallingTiles) new PoppedTile(this.camera, {
            "x": tileX,
            "y": tileY,
        }, (tileX + tileY) % 2);
        if (this.get(tileX, tileY).value === -1) this.loseGame();
        this.score++;
        if (this.score > localStorage[`highScore_${this.mode}`]) localStorage[`highScore_${this.mode}`] = this.score;
        this.leftToEmpty.splice(0, 1);
        this.updateScoreContainer();
    }

    initializeControls(canvas) {
        const dig = (x, y) => {
            if (!this.get(x, y).covered || this.get(x, y).flagState > 0) return;
            this.leftToEmpty.splice(0, 0, `${x},${y}`);

            if (!Settings.settings.animateTileReveal) while (this.leftToEmpty.length > 0) this.digQueuedTile(0);
        }
        const toggleFlag = (x, y) => {
            if (!this.get(x, y).covered) return;
            this.set(x, y, {
                "flagState": 1 - this.get(x, y).flagState,
                "flagAnimationFrame": 0,
            });
            if (Settings.settings.animateFlags && this.get(x, y).flagState === 0) new PoppedTile(this.camera, {
                "x": x,
                "y": y,
            }, 2);
            this.flags += this.get(x, y).flagState;
            this.updateScoreContainer();
        };

        canvas.addEventListener("mouseup", (event) => {
            if (!this.boardControls) return;
            let x = Math.floor(this.camera.position.x + Input.mouse.position.x / this.camera.tilesize);
            let y = Math.floor(this.camera.position.y + Input.mouse.position.y / this.camera.tilesize);
            if (event.button === 0) {
                if (this.score === 0) {
                    this.snapToInitialTile();
                    x = Math.floor(this.camera.position.x + Input.mouse.position.x / this.camera.tilesize);
                    y = Math.floor(this.camera.position.y + Input.mouse.position.y / this.camera.tilesize);
                    this.leftMost = this.rightMost = x;
                    this.topMost = this.bottomMost = y;
                }
                dig(x, y);
            }
            if (event.button === 2 && this.score > 0) toggleFlag(x, y);
        });

        this.updateScoreContainer();
    }

    zoomToFit() {
        const verticalDiff = Math.abs(this.bottomMost - this.topMost) + 2;
        const horizontalDiff = Math.abs(this.rightMost - this.leftMost) + 2;

        const horizontalSize = window.innerWidth / horizontalDiff;
        const verticalSize = window.innerHeight / verticalDiff;

        this.camera.targetTilesize = Math.min(Math.max(16, Math.round(Math.min(horizontalSize, verticalSize))), 128);

        this.camera.centered = {
            "left": this.leftMost,
            "right": this.rightMost,
            "top": this.topMost,
            "bottom": this.bottomMost,
        }
    }

    loseGame() {
        this.boardControls = false;
        this.camera.cameraControls = false;

        window.setTimeout(() => this.zoomToFit(), 1000);
        window.clearInterval(this.secondsInterval);

        window.setTimeout(() => {
            document.querySelector("#scoreContainer").setAttribute("hide", true);
        }, 2000);
    }

    updateScoreContainer() {
        document.querySelector("#label_score").innerText = this.score;
        document.querySelector("#label_flags").innerText = this.flags;
        if (this.secondsPlayed < 60) document.querySelector("#label_hours").innerText = `${this.secondsPlayed}s`;
        else if (this.secondsPlayed < 60 * 60) document.querySelector("#label_hours").innerText = `${(this.secondsPlayed / 60).toFixed(1)}m`;
        else document.querySelector("#label_hours").innerText = `${(this.secondsPlayed / 60 / 60).toFixed(1)}h`;
        document.querySelector("#label_highscore").innerText = localStorage[`highScore_${this.mode}`];
    }
}

export default Board;