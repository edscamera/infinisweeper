import { prng, Vector2, Input, Image, SoundEffect, Particle, $, deviceType } from "./Util.js";
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
        this.boardControls = boardControls;
        this.camera = camera ?? null;

        Particle.particles = [];
        PoppedTile.tiles = [];

        this.mode = "normal";

        this.leftToEmpty = [];
        this.colorCorrection = 0;
        this.spreadParticles = false;

        this.score = 0;
        this.flags = 0;

        this.leftMost = null;
        this.rightMost = null;
        this.topMost = null;
        this.bottomMost = null;

        this.rushTimeLeft = 5;

        this.secondsPlayed = 0;
        this.secondsInterval = window.setInterval(() => {
            if (this.boardControls) {
                this.secondsPlayed++;
                this.updateScoreContainer();
            }
            if (this.score > 0 && this.mode === "rush") {
                this.rushTimeLeft--;
                if (this.rushTimeLeft < 0) this.loseGame();
            }
        }, 1000);
        if (Settings.settings.autoSave) {
            this.autoSaveInterval = window.setInterval(() => {
                if (this.boardControls && Settings.settings.autoSave) {
                    const elm = document.querySelector("#saveGame");
                    if (elm.disabled) return;
                    elm.disabled = true;
                    elm.innerText = "Auto Saving 0%";
                    this.saveGame((d) => {
                        elm.innerText = `Auto Saving ${Math.round(d * 100)}%`;
                    }, (e) => {
                        elm.innerText = "Auto Saved!";
                        window.setTimeout(() => {
                            elm.disabled = false;
                            elm.innerText = "Save Game";
                        }, 1000);
                    });
                }
            }, Settings.settings.autoSave_t * 1000 * 60);
        }
        window.setInterval(() => {
            if (this.spreadParticles) {
                for (let x = Math.floor(this.camera.position.x); x <= this.camera.position.x + window.innerWidth / this.camera.tilesize; x++) {
                    for (let y = Math.floor(this.camera.position.y); y <= this.camera.position.y + window.innerHeight / this.camera.tilesize; y++) {
                        if (this.get(x, y).value === -1 && this.get(x, y).covered) {
                            this.set(x, y, {
                                "covered": false,
                            });

                            const partialVal = (x - this.camera.position.x) * (y - this.camera.position.y);
                            const totalVal = (window.innerWidth / this.camera.tilesize) * (window.innerHeight / this.camera.tilesize);
                            const colorVal = `hsl(${partialVal / totalVal * 360},100%,50%)`;
                            Particle.fullExplosion(
                                this.camera,
                                { "x": x + .5, "y": y + .5 },
                                0.15,
                                5, [colorVal], 0.5, 0.5);
                            return;
                        }
                    }
                }
            }
        }, 50);

        if (!localStorage[`highScore_${this.mode}`]) localStorage[`highScore_${this.mode}`] = 0;

        document.querySelector("#gameGUI").setAttribute("hide", false);
        document.querySelector("#loseContainer").setAttribute("hide", true);
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
                        if (!tile.incorrectFlag) {
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
                        } else {
                            g.drawImage(
                                Image.get("incorrect_flag"),
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
        for (let _ = 0; _ < Settings.settings.animateTileReveal_t; _++) if (this.leftToEmpty.length > 0) {
            this.digQueuedTile(0);
            if (Settings.settings.cameraShake) {
                this.camera.position.x += (Math.random() - 0.5) * Math.min(this.leftToEmpty.length, 30) * 0.025;
                this.camera.position.y += (Math.random() - 0.5) * Math.min(this.leftToEmpty.length, 30) * 0.025;
            }
        }
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
        return this.initialTile;
    }

    digQueuedTile(index) {
        const tileX = parseInt(this.leftToEmpty[index].split(",")[0]);
        const tileY = parseInt(this.leftToEmpty[index].split(",")[1]);
        if (Settings.settings.animateTileReveal) SoundEffect.play(`blip_${this.get(tileX, tileY).value}`);
        let highestNumber = 1;
        for (let xx = tileX - 1; xx <= tileX + 1; xx++) {
            for (let yy = tileY - 1; yy <= tileY + 1; yy++) {
                if (this.get(xx, yy).covered && this.get(tileX, tileY).value === 0 && !this.leftToEmpty.includes(`${xx},${yy}`)) this.leftToEmpty.push(`${xx},${yy}`);
            }
        }
        this.set(tileX, tileY, { "covered": false, });
        if (tileX - 2 < this.leftMost) this.leftMost = tileX - 2;
        if (tileX + 2 > this.rightMost) this.rightMost = tileX + 2;
        if (tileY - 2 < this.topMost) this.topMost = tileY - 2;
        if (tileY + 2 > this.bottomMost) this.bottomMost = tileY + 2;
        if (Settings.settings.animateFallingTiles) new PoppedTile(this.camera, {
            "x": tileX,
            "y": tileY,
        }, Math.abs((tileX + tileY) % 2));
        if (this.get(tileX, tileY).value > highestNumber) highestNumber = this.get(tileX, tileY).value;
        if (this.get(tileX, tileY).value === -1) {
            SoundEffect.play("confetti");
            const partialVal = (tileX - this.camera.position.x) * (tileY - this.camera.position.y);
            const totalVal = (window.innerWidth / this.camera.tilesize) * (window.innerHeight / this.camera.tilesize);
            const colorVal = `hsl(${partialVal / totalVal * 360},100%,50%)`;
            Particle.fullExplosion(
                this.camera,
                { "x": tileX + .5, "y": tileY + .5 },
                0.15,
                40, [colorVal], 0.5, 0.5);
            this.loseGame();
        } else this.rushTimeLeft = 5;
        this.score++;
        if (this.score > localStorage[`highScore_${this.mode}`]) localStorage[`highScore_${this.mode}`] = this.score;
        this.leftToEmpty.splice(0, 1);
        this.updateScoreContainer();
        return this.get(tileX, tileY).value === -1 ? -1 : highestNumber;
    }

    initializeControls(canvas) {
        $("#zoomIN").onclick = () => {
            this.camera.setTilesize(this.camera.tilesize + 8);
            this.camera.tilesize = Math.round(this.camera.tilesize);
        }
        $("#zoomOUT").onclick = () => {
            if (this.camera.tilesize > 8) this.camera.setTilesize(this.camera.tilesize - 8);
            else this.camera.tilesize = this.camera.targetTilesize = 8;
            this.camera.tilesize = Math.round(this.camera.tilesize);
        }
        const dig = (x, y) => {
            if (!this.get(x, y).covered || this.get(x, y).flagState > 0) return;
            this.leftToEmpty.splice(0, 0, `${x},${y}`);

            let highestNumber = 0;
            let tilesDug = 0;
            if (!Settings.settings.animateTileReveal) while (this.leftToEmpty.length > 0) {
                let num = this.digQueuedTile(0);
                tilesDug++;
                if (num > highestNumber) highestNumber = num;
                if (num === -1) highestNumber = -1;
            }
            if (tilesDug > 20) {
                SoundEffect.play("reveal");
                this.camera.shake(0.3);
            }
            else if (highestNumber !== -1) SoundEffect.play(`blip_${highestNumber}`);
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
            SoundEffect.play(this.get(x, y).flagState === 0 ? "flag_up" : "flag_down");
            this.updateScoreContainer();
        };

        if (deviceType() === "desktop") {
            canvas.onmouseup = event => {
                if (!this.boardControls || this.camera.lockedToDrag) return;
                if (this.holdingDelay) {
                    this.holdingDelay = false;
                    return;
                }
                let x = Math.floor(this.camera.position.x + Input.mouse.position.x / this.camera.tilesize);
                let y = Math.floor(this.camera.position.y + Input.mouse.position.y / this.camera.tilesize);
                if (this.score > 0 && (event.button === 2 || (event.button === 0 && (event.ctrlKey || event.shiftKey)))) return toggleFlag(x, y);
                if (event.button === 0) {
                    if (this.score === 0) {
                        this.snapToInitialTile();
                        x = Math.floor(this.camera.position.x + Input.mouse.position.x / this.camera.tilesize);
                        y = Math.floor(this.camera.position.y + Input.mouse.position.y / this.camera.tilesize);
                        this.leftMost = x - 2;
                        this.rightMost = x + 2;
                        this.topMost = y - 2;
                        this.bottomMost = y + 2;
                    }
                    dig(x, y);
                }
            };
        }

        this.og = {};
        this.holdingDelay = false;
        canvas.addEventListener("touchstart", (event) => {
            if (!this.boardControls || this.camera.pinchZoom > 0) return;
            this.holding = true;
            let x = Math.floor(this.camera.position.x + event.touches[0].pageX / this.camera.tilesize);
            let y = Math.floor(this.camera.position.y + event.touches[0].pageY / this.camera.tilesize);
            this.og = { "x": x, "y": y, };
            setTimeout(() => {
                if (this.holding && this.score > 0 && !this.camera.lockedToDrag && this.camera.pinchZoom == 0) {
                    toggleFlag(x, y);
                    this.holdingDelay = true;
                }
            }, 150);
        });
        canvas.addEventListener("touchend", (event) => {
            if (!this.boardControls) return;
            if (this.camera.lockedToDrag || this.camera.pinchZoom > 0) return;
            this.holding = false;
            if (this.holdingDelay) return this.holdingDelay = false;
            const x = this.og.x;
            const y = this.og.y;
            if (this.score === 0) {
                this.snapToInitialTile();
                this.leftMost = x - 2;
                this.rightMost = x + 2;
                this.topMost = y - 2;
                this.bottomMost = y + 2;
                dig(this.initialTile.x, this.initialTile.y);
            } else {
                dig(x, y);
            }
        });
        canvas.addEventListener("touchcancel", (event) => {
            this.holding = false;
            if (this.holdingDelay) return this.holdingDelay = false;
        });

        this.updateScoreContainer();
    }

    zoomToFit() {
        const verticalDiff = Math.abs(this.bottomMost - this.topMost);
        const horizontalDiff = Math.abs(this.rightMost - this.leftMost);

        const horizontalSize = window.innerWidth / horizontalDiff;
        const verticalSize = window.innerHeight / verticalDiff;

        this.camera.targetTilesize = Math.min(Math.max(12, Math.round(Math.min(horizontalSize, verticalSize))), 128);

        this.camera.centered = {
            "left": this.leftMost - 2,
            "right": this.rightMost + 2,
            "top": this.topMost - 2,
            "bottom": this.bottomMost + 2,
        }
    }

    loseGame() {
        if (this.mode === "normal") localStorage.saved_data = null;

        this.boardControls = false;
        this.camera.cameraControls = false;

        window.setTimeout(() => this.zoomToFit(), 1000);
        window.clearInterval(this.secondsInterval);

        const flagBonus = Object.keys(this.board).filter(key => this.board[key].value === -1 && this.board[key].flagState).length * (this.mode === "rush" ? 5 : 1);
        let missedFlag = Object.keys(this.board).filter(key => this.board[key].value !== -1 && this.board[key].flagState);
        missedFlag.forEach(key => {
            if (Settings.settings.animateFlags) new PoppedTile(this.camera, {
                "x": parseFloat(key.split(",")[0]),
                "y": parseFloat(key.split(",")[1]),
            }, 2);
            this.board[key].incorrectFlag = true;
        });

        document.querySelector("#pointCount").innerHTML = flagBonus === 0 ? "" : `<span>${this.score} Tile Points</span><br />`;
        if (flagBonus > 0) document.querySelector("#pointCount").innerHTML += `<span id="flagbonusdisplay">+${flagBonus}${this.mode === "rush" ? " RUSH" : ""} Flag Bonus</span><br /><br />`;
        document.querySelector("#pointCount").innerHTML += `<span id="pointsdisplay">${this.score + flagBonus} Points!</span><br />`
        setTimeout(() => {
            if (document.querySelector("#flagbonusdisplay")) document.querySelector("#flagbonusdisplay").style.color = "red";
            document.querySelector("#pointsdisplay").style.color = "green";
        }, 1);

        if (this.score + flagBonus > localStorage[`highScore_${this.mode}`]) localStorage[`highScore_${this.mode}`] = this.score + flagBonus;

        const myBtn = document.querySelector("#onlineBtn");
        if (typeof window.firebase === "undefined" || typeof window.db === "undefined") {
            myBtn.onclick = () => { };
            myBtn.innerText = "Can't Connect";
            myBtn.disabled = true;
        } else {
            myBtn.disabled = false;
            if (firebase.auth().currentUser) {
                myBtn.onclick = () => {
                    myBtn.innerText = "Uploading...";
                    db.ref(`/scores/${this.mode}/${firebase.auth().getUid()}/score`).once('value').then(snapshot => {
                        if (snapshot.val() < this.score + flagBonus) {
                            db.ref(`/scores/${this.mode}/${firebase.auth().getUid()}`).set({
                                "score": this.score + flagBonus,
                                "uid": firebase.auth().getUid(),
                                "timestamp": new Date().getTime(),
                            });
                            myBtn.innerText = "Uploaded!";
                        } else {
                            myBtn.innerText = "Score already Uploaded!";
                        }
                        myBtn.addEventListener("mouseout", () => {
                            myBtn.innerText = "Upload Score";
                        }, { "once": true });
                    });
                };
                myBtn.innerText = "Upload Score";
            } else {
                myBtn.onclick = () => {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    firebase.auth().signInWithPopup(provider).then((result) => {
                        onAuthStateChanged();
                    }).catch((error) => {
                        myBtn.innerText = "Error";
                        myBtn.addEventListener("mouseout", () => {
                            myBtn.innerText = "Sign In";
                        }, { "once": true });
                        console.error(error);
                    });
                };
                myBtn.innerText = "Sign In";
            }
        }

        const flavorText = [
            "Better luck next time!",
            "Get a move on!",
            "You could do better than that...",
            "Have a nice day!",
            "That's it?",
            `Only ${this.score + flagBonus} points?`,
            `That +${flagBonus} flag bonus came in handy.`,
            "There was a mine right there.",
            "Grant Burns finished the music theory test before you.",
            "C'mon. One more game.",
            "Getting better.",
            "You could use a hand.",
            "Hahaha.",
            "I'm disappointed.",
            "You've lost.",
            "Idiot. Idiot. Idiot.",
        ];
        document.querySelector("#lossFlavortext").innerText = flavorText[Math.floor(flavorText.length * Math.random())];

        window.setTimeout(() => {
            document.querySelector("#gameGUI").setAttribute("hide", true);
            document.querySelector("#loseContainer").setAttribute("hide", false);
            this.spreadParticles = true;
        }, 2000);
    }

    updateScoreContainer() {
        document.querySelector("#saveGame").style.display = this.mode === "normal" ? "block" : "none";
        document.querySelector("#label_score").innerText = this.score;
        document.querySelector("#label_flags").innerText = this.flags;
        document.querySelector("#label_hours").style.color = "#000";
        if (this.mode === "rush") {
            document.querySelector("#label_hours").innerText = `${this.rushTimeLeft}s`;
            document.querySelector("#label_hours").style.color = "#F00";
        } else if (this.secondsPlayed < 60) document.querySelector("#label_hours").innerText = `${this.secondsPlayed}s`;
        else if (this.secondsPlayed < 60 * 60) document.querySelector("#label_hours").innerText = `${(this.secondsPlayed / 60).toFixed(1)}m`;
        else document.querySelector("#label_hours").innerText = `${(this.secondsPlayed / 60 / 60).toFixed(1)}h`;
        document.querySelector("#label_highscore").innerText = localStorage[`highScore_${this.mode}`];
    }

    saveGame(progresscb, endcb) {
        if (this.mode !== "normal" || !this.boardControls) {
            if (endcb) endcb(false);
            return;
        }
        let index = 0;
        const keys = Object.keys(this.board);
        let data = `${this.seed},${this.camera.position.x},${this.camera.position.y},${this.camera.tilesize},${this.secondsPlayed}`;
        const saveInterval = setInterval(() => {
            for (let _ = 0; _ < 100; _++) {
                if (!this.board[keys[index]].covered || this.board[keys[index]].flagState) {
                    data += `,${keys[index]}`;
                    data += `,${this.board[keys[index]].covered ? 2 : 0}`
                }
                if (progresscb) progresscb(index / keys.length);
                index++;
                if (index >= keys.length) {
                    localStorage.saved_data = data;
                    clearInterval(saveInterval);
                    if (endcb) endcb(true);
                    break;
                }
            }
        });
    }
}

export default Board;