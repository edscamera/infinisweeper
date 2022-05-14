const CANVAS = document.createElement("canvas");
const g = CANVAS.getContext("2d");
document.body.appendChild(CANVAS);

const bombChance = 0.2;

let seed = null;
let gameLost = false;
let score = 0;
let flags = 0;
let minesweeperMap = {};
let GAME_STATE = "title";

let GAME_MODE = null;
let rushTime = 5;
let rushInterval = null;
let myDisplayName = "Offline";

class PoppedTile {
    static tiles = [];
    constructor(position, type) {
        this.type = type;
        this.position = position;
        this.rotation = 0;
        this.rotationVel = 0;
        this.velocity = {
            x: (Math.random() - 0.5) * 10 / (64 / camera.tilesize),
            y: -Math.random() * 10 / (64 / camera.tilesize),
        };
        this.size = camera.tilesize;
        PoppedTile.tiles.push(this);
    }
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.y += 0.2;
        this.rotation += this.rotationVel;
        if (Math.abs(this.rotationVel) < 0.1)
            this.rotationVel += 0.005 * Math.sign(this.velocity.x);
    }
    draw() {
        g.save();
        g.translate(
            this.position.x - camera.x * camera.tilesize + this.size / 2,
            this.position.y - camera.y * camera.tilesize + this.size / 2
        );
        g.rotate(this.rotation);
        g.fillStyle = this.type % 2 === 0 ? "#AAD650" : "#A2D048";
        if ([0, 1].includes(this.type)) g.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        if (this.type === 2) g.drawImage(img.flag_icon, -this.size / 2, -this.size / 2, this.size, this.size);
        g.restore();
        this.size *= 0.99;
        if (this.size <= 1)
            PoppedTile.tiles.splice(PoppedTile.tiles.indexOf(this), 1);
    }
    static updateAllPoppedTiles() {
        this.tiles.forEach(t => t.update());
    }
    static drawAllPoppedTiles() {
        this.tiles.forEach(t => t.draw());
    }
}

const img = {
    flag_icon: "./img/flag_icon.png",
    flag_gif: "./img/flag_plant.png",
};
sfx.data = {
    0: "./sfx/0.mp3",
    1: "./sfx/1.mp3",
    2: "./sfx/2.mp3",
    3: "./sfx/3.mp3",
    4: "./sfx/4.mp3",
    5: "./sfx/5.mp3",
    6: "./sfx/6.mp3",
    7: "./sfx/7.mp3",
    8: "./sfx/8.mp3",
    flag_up: "./sfx/flag_up.mp3",
    flag_down: "./sfx/flag_down.mp3",
    confetti: "./sfx/confetti.mp3",
};

const camera = {
    tilesize: 64,
    canMove: false,
    x: 0,
    y: 0,
};

let frameCount = 0;
window.addEventListener("load", () => {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    window.setInterval(() => {
        g.fillStyle = "#fff";
        g.fillRect(0, 0, CANVAS.width, CANVAS.height);

        update();
        draw();

        frameCount++;
    }, 1000 / 60);
    Input.initialize();
    $("#versionCalc").innerText = document.getElementById("changelog").querySelector("span").innerText;
    CANVAS.addEventListener("contextmenu", (evt) => evt.preventDefault());
});
window.addEventListener("resize", () => {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    draw();
});

const updateTile = (x, y) => {
    if (!minesweeperMap.hasOwnProperty([`${x},${y}`])) return;
    if (minesweeperMap[`${x},${y}`]["#"] === -1) return;
    minesweeperMap[`${x},${y}`]["#"] = 0;
    for (let yy = y - 1; yy <= y + 1; yy++) {
        for (let xx = x - 1; xx <= x + 1; xx++) {
            try {
                if (!(xx === x && yy === y) && minesweeperMap[`${xx},${yy}`]["#"] === -1) minesweeperMap[`${x},${y}`]["#"]++;
            } catch (e) { }
        }
    }
};

const getMinesweeperMap = (x, y) => {
    const address = `${x},${y}`;

    if (!minesweeperMap.hasOwnProperty(address)) {
        minesweeperMap[address] = {
            c: 1,
            "#":
                prng(parseFloat(x) * 1000 + parseFloat(y), parseFloat(seed)) >
                    1 - bombChance
                    ? -1
                    : 0,
        };
        for (let yy = y - 1; yy <= y + 1; yy++) {
            for (let xx = x - 1; xx <= x + 1; xx++) {
                updateTile(xx, yy);
            }
        }
    }
    return minesweeperMap[address];
};

const draw = () => {
    if (typeof colorCorrection == 'undefined') colorCorrection = 0;
    switch (GAME_STATE) {
        case "title":
        case "scores":
            const tileWidth = Math.ceil(CANVAS.width / camera.tilesize) + 1;
            const tileHeight = Math.ceil(CANVAS.height / camera.tilesize) + 1;
            for (let x = 0; x < tileWidth; x++) {
                for (let y = 0; y < tileHeight; y++) {
                    const renderX = ((x * camera.tilesize + frameCount) % (tileWidth * camera.tilesize)) - camera.tilesize;
                    const renderY = ((y * camera.tilesize + frameCount) % (tileHeight * camera.tilesize)) - camera.tilesize;
                    g.fillStyle = Math.abs((Math.floor(renderY / camera.tilesize) + Math.floor(renderX / camera.tilesize)) % 2) === 0 ? "#AAD650" : "#A2D048";
                    g.fillRect(renderX, renderY, camera.tilesize, camera.tilesize);
                }
            }
            break;
        case "game":
            if (score > 0) {
                for (let x = Math.floor(camera.x); x < camera.x + CANVAS.width / camera.tilesize; x++) {
                    for (let y = Math.floor(camera.y); y < camera.y + CANVAS.height / camera.tilesize; y++) {
                        if (getMinesweeperMap(x, y)["c"] > 0) {
                            // Draw Ground
                            g.fillStyle = Math.abs((x + y + colorCorrection) % 2) === 0 ? "#AAD650" : "#A2D048";
                            g.fillRect(
                                Math.round((x - camera.x) * camera.tilesize),
                                Math.round((y - camera.y) * camera.tilesize),
                                camera.tilesize,
                                camera.tilesize
                            );
                            // Draw Flags
                            if (getMinesweeperMap(x, y)["c"] >= 2 && getMinesweeperMap(x, y)["c"] < 9) {
                                minesweeperMap[`${x},${y}`]["c"] += 0.5;
                                g.drawImage(
                                    img.flag_gif, 1, 81 * (Math.floor(minesweeperMap[`${x},${y}`]["c"]) - 2), 81, 80,
                                    (x - camera.x) * camera.tilesize,
                                    (y - camera.y) * camera.tilesize,
                                    camera.tilesize, camera.tilesize
                                );
                            }
                            if (getMinesweeperMap(x, y)["c"] >= 9) {
                                g.drawImage(
                                    img.flag_icon,
                                    (x - camera.x) * camera.tilesize,
                                    (y - camera.y) * camera.tilesize,
                                    camera.tilesize, camera.tilesize
                                );
                            }
                        } else {
                            // Draw Background tiles
                            g.fillStyle = Math.abs((x + y + colorCorrection) % 2) === 1 ? "#D7B998" : "#E4C29E";
                            g.fillRect(
                                Math.round((x - camera.x) * camera.tilesize),
                                Math.round((y - camera.y) * camera.tilesize),
                                camera.tilesize, camera.tilesize
                            );
                            // Draw Borders
                            g.strokeStyle = g.fillStyle = "#86AE3A";
                            g.lineWidth = camera.tilesize / (64 / 15) / 2;
                            g.beginPath();
                            const condition = (x, y) => (getMinesweeperMap(x, y)["c"] === 0 && getMinesweeperMap(x, y)["#"] === -1) || getMinesweeperMap(x, y)["c"] > 0;
                            if (condition(x + 1, y)) { // Right
                                g.moveTo(
                                    Math.round((x - camera.x + 1) * camera.tilesize - g.lineWidth / 2),
                                    Math.round((y - camera.y) * camera.tilesize)
                                );
                                g.lineTo(
                                    Math.round((x - camera.x + 1) * camera.tilesize - g.lineWidth / 2),
                                    Math.round((y - camera.y + 1) * camera.tilesize)
                                );
                            }
                            if (condition(x - 1, y)) { // Left
                                g.moveTo(
                                    Math.round((x - camera.x) * camera.tilesize + g.lineWidth / 2),
                                    Math.round((y - camera.y) * camera.tilesize)
                                );
                                g.lineTo(
                                    Math.round((x - camera.x) * camera.tilesize + g.lineWidth / 2),
                                    Math.round((y - camera.y + 1) * camera.tilesize)
                                );
                            }
                            if (condition(x, y + 1)) { // Bottom
                                g.moveTo(
                                    Math.round((x - camera.x) * camera.tilesize),
                                    Math.round((y - camera.y + 1) * camera.tilesize - g.lineWidth / 2)
                                );
                                g.lineTo(
                                    Math.round((x - camera.x + 1) * camera.tilesize),
                                    Math.round((y - camera.y + 1) * camera.tilesize - g.lineWidth / 2)
                                );
                            }
                            if (condition(x, y - 1)) { // Top
                                g.moveTo(
                                    Math.round((x - camera.x) * camera.tilesize),
                                    Math.round((y - camera.y) * camera.tilesize + g.lineWidth / 2)
                                );
                                g.lineTo(
                                    Math.round((x - camera.x + 1) * camera.tilesize),
                                    Math.round((y - camera.y) * camera.tilesize + g.lineWidth / 2)
                                );
                            }
                            g.stroke();
                            if (condition(x - 1, y - 1)) g.fillRect( // Top Left
                                (x - camera.x) * camera.tilesize,
                                (y - camera.y) * camera.tilesize,
                                g.lineWidth, g.lineWidth
                            );
                            if (condition(x + 1, y - 1)) g.fillRect( // Top Right
                                (x - camera.x + 1) * camera.tilesize - g.lineWidth,
                                (y - camera.y) * camera.tilesize,
                                g.lineWidth, g.lineWidth
                            );
                            if (condition(x - 1, y + 1)) g.fillRect( // Bottom Left
                                (x - camera.x) * camera.tilesize,
                                (y - camera.y + 1) * camera.tilesize - g.lineWidth,
                                g.lineWidth, g.lineWidth
                            );
                            if (condition(x + 1, y + 1)) g.fillRect( // Bottom Right
                                (x - camera.x + 1) * camera.tilesize - g.lineWidth,
                                (y - camera.y + 1) * camera.tilesize - g.lineWidth,
                                g.lineWidth, g.lineWidth
                            );

                            // Draw Numbers
                            const colors = {
                                1: "#1977D3",
                                2: "#3B8E3F",
                                3: "#D53734",
                                4: "#7A1EA2",
                                5: "#FF8F00",
                                6: "#159AA4",
                                7: "#434343",
                                8: "#A99D93",
                            }
                            g.fillStyle = colors[getMinesweeperMap(x, y)["#"]];
                            const metrics = g.measureText(getMinesweeperMap(x, y)["#"]);
                            const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
                            if (getMinesweeperMap(x, y)["#"] > 0) {
                                g.font = `${camera.tilesize / (64 / 48)}px roboto`;
                                g.fillText(
                                    getMinesweeperMap(x, y)["#"],
                                    (x - camera.x + 0.5) * camera.tilesize -
                                    metrics.width / 2,
                                    (y - camera.y + 0.5) * camera.tilesize +
                                    textHeight * 0.5,
                                    camera.tilesize
                                );
                            }
                            // Draw Bombs
                            if (getMinesweeperMap(x, y)["#"] === -1) {
                                g.fillStyle = `hsl(${((x - camera.x) * 5 + (y - camera.y) * 5) % 360},100%,50%)`;
                                if (!minesweeperMap[`${x},${y}`]["t"]) minesweeperMap[`${x},${y}`]["t"] = 255;
                                minesweeperMap[`${x},${y}`]["t"] += (0 - minesweeperMap[`${x},${y}`]["t"]) / 150;
                                g.fillRect(
                                    (x - camera.x) * camera.tilesize - 0.5,
                                    (y - camera.y) * camera.tilesize - 0.5,
                                    camera.tilesize + 1,
                                    camera.tilesize + 1
                                );
                                const centerVal = minesweeperMap[`${x},${y}`]["t"];
                                g.fillStyle = `rgb(${centerVal},${centerVal},${centerVal})`;
                                g.beginPath();
                                g.ellipse(
                                    (x - camera.x + 0.5) * camera.tilesize,
                                    (y - camera.y + 0.5) * camera.tilesize,
                                    camera.tilesize / 4,
                                    camera.tilesize / 4,
                                    0, 0, Math.PI * 2
                                );
                                g.fill();
                            }
                        }
                    }
                }
            }
            // Constant 0 at first click
            if (score === 0) {
                // Get address of block with # of 0
                let j = -1;
                do {
                    for (let x = -2; x < 2; x++) for (let y = -2; y < 2; y++) getMinesweeperMap(j + x, y);
                    target = `${j},0`;
                    j++;
                } while (minesweeperMap[target]["#"] !== 0);
                // Align camera so mouse is always on target
                camera.x = parseFloat(target.split(",")[0]) - Math.floor(Input.mouse.position.x / camera.tilesize);
                camera.y = parseFloat(target.split(",")[1]) - Math.floor(Input.mouse.position.y / camera.tilesize);
                // Calculate color difference
                colorCorrection = (parseFloat(target.split(",")[0]) + parseFloat(target.split(",")[1])) % 2;
                colorCorrection -= Math.abs((Math.floor(Input.mouse.position.x / camera.tilesize) + Math.floor(Input.mouse.position.y / camera.tilesize)) % 2);
                // Draw overlay
                for (let x = 0; x < CANVAS.width / camera.tilesize; x++) {
                    for (let y = 0; y < CANVAS.height / camera.tilesize; y++) {
                        g.fillStyle = Math.abs((x + y) % 2) === 0 ? "#AAD650" : "#A2D048";
                        g.fillRect(
                            x * camera.tilesize,
                            y * camera.tilesize,
                            camera.tilesize, camera.tilesize
                        );
                    }
                }
            }
            break;
    }
    PoppedTile.drawAllPoppedTiles();
    Particle.drawAllParticles();
};

const update = () => {
    Particle.updateAllParticles();
    PoppedTile.updateAllPoppedTiles();
    if (GAME_STATE === "game") {
        if (gameLost || !camera.canMove) return;
        if (Input.keyDown["ArrowRight"]) {
            camera.x += 0.5;
        }
        if (Input.keyDown["ArrowLeft"]) {
            camera.x -= 0.5;
        }
        if (Input.keyDown["ArrowDown"]) {
            camera.y += 0.5;
        }
        if (Input.keyDown["ArrowUp"]) {
            camera.y -= 0.5;
        }
    }
};

// Drag Screen
let dragging = false;
CANVAS.addEventListener("mousedown", () => {
    if (GAME_STATE !== "game" || gameLost) return;
    const onMouseMove = (evt) => {
        if (dragging || (!dragging && Math.abs(evt.movementX) + Math.abs(evt.movementY) > 1)) {
            camera.x -= evt.movementX / camera.tilesize;
            camera.y -= evt.movementY / camera.tilesize;
            dragging = true;
        }
    };
    CANVAS.addEventListener("mousemove", onMouseMove);
    CANVAS.addEventListener("mouseup",
        () => {
            CANVAS.removeEventListener("mousemove", onMouseMove);
            dragging = false;
            saveData();
        }, { once: true });
});
CANVAS.addEventListener("touchmove", (evt) => {
    evt.preventDefault();
    if (GAME_STATE !== "game" || gameLost) return;
    if (Math.abs(Input.swipe.x) + Math.abs(Input.swipe.y) > 0) {
        camera.x -= Input.swipe.x / camera.tilesize;
        camera.y -= Input.swipe.y / camera.tilesize;
        dragging = true;
    }
});
CANVAS.addEventListener("touchend", () => {
    dragging = false;
    saveData();
});

// Hold to flag
let toggleFlagDisable = false;
CANVAS.addEventListener("touchstart", (evt) => {
    if (GAME_STATE !== "game" || gameLost || dragging) return;
    setTimeout(() => {
        const x = Math.floor((camera.x * camera.tilesize + evt.targetTouches[0].clientX) / camera.tilesize);
        const y = Math.floor((camera.y * camera.tilesize + evt.targetTouches[0].clientY) / camera.tilesize);
        if (Input.touch && !dragging && score > 0) {
            toggleFlag(x, y);
            toggleFlagDisable = true;
        }
    }, 250);
});

const toggleFlag = (x, y) => {
    if (getMinesweeperMap(x, y)["c"] === 1) {
        minesweeperMap[`${x},${y}`]["c"] = 2;
        sfx.play("flag_down");
        flags++;
    } else if (getMinesweeperMap(x, y)["c"] >= 2) {
        new PoppedTile({ "x": x * camera.tilesize, "y": y * camera.tilesize, }, 2);
        minesweeperMap[`${x},${y}`]["c"] = 1;
        sfx.play("flag_up");
        flags--;
    }
    saveData();
};

CANVAS.addEventListener("mouseup", (evt) => {
    if (toggleFlagDisable) return toggleFlagDisable = false;
    if (GAME_STATE !== "game" || gameLost || dragging) return;

    const x = Math.floor((camera.x * camera.tilesize + Input.mouse.position.x) / camera.tilesize);
    const y = Math.floor((camera.y * camera.tilesize + Input.mouse.position.y) / camera.tilesize);

    if (evt.button === 2 && !Input.touch && score > 0) {
        toggleFlag(x, y);
        return updateLabels();
    }

    if (evt.button === 0 && (evt.ctrlKey || evt.shiftKey) && !Input.touch && score > 0) {
        toggleFlag(x, y);
        return updateLabels();
    }

    if (evt.button === 0) {
        if (score === 0 && GAME_MODE === "rush") {
            clearInterval(rushInterval);
            rushInterval = setInterval(() => {
                rushTime--;
                if (rushTime === -1) {
                    rushTime = 0;
                    clearInterval(rushInterval);
                    loseGame();
                }
                updateLabels();
            }, 1000);
        }
        camera.canMove = true;
        let leftToEmpty = [[x, y]];
        if (minesweeperMap[`${x},${y}`]["c"] !== 1) return;
        let cycles = 0;
        let highestNumber = 1;
        while (leftToEmpty.length > 0) {
            const x2 = Math.floor(leftToEmpty[0][0]);
            const y2 = Math.floor(leftToEmpty[0][1]);
            if (minesweeperMap[`${x2},${y2}`]["c"] === 1) {
                score++;
                if (minesweeperMap[`${x2},${y2}`]["#"] > highestNumber)
                    highestNumber = minesweeperMap[`${x2},${y2}`]["#"];
                new PoppedTile(
                    {
                        "x": x2 * camera.tilesize,
                        "y": y2 * camera.tilesize,
                    },
                    Math.abs((x2 + y2) % 2)
                );
            }
            minesweeperMap[`${x2},${y2}`]["c"] = 0;
            for (let xoffset = -1; xoffset <= 1; xoffset++) {
                for (let yoffset = -1; yoffset <= 1; yoffset++) {
                    if (getMinesweeperMap(x2 + xoffset, y2 + yoffset)["c"] === 1 && getMinesweeperMap(x2, y2)["#"] === 0) leftToEmpty.push([x2 + xoffset, y2 + yoffset]);
                }
            }

            leftToEmpty = leftToEmpty.slice(1);
            cycles++;
            if (cycles > 50000) break;
        }
        if (cycles > 30) {
            const shake = setInterval(() => {
                camera.x += (Math.random() - 0.5) * 0.2;
                camera.y += (Math.random() - 0.5) * 0.2;
            }, 10);
            setTimeout(() => clearInterval(shake), 400);
            sfx.play("0")
        } else {
            sfx.play(highestNumber.toString());
        }

        saveData();

        if (minesweeperMap[`${x},${y}`]["#"] === -1) {
            localStorage.setItem(storageKey("saveData"), "None");
            sfx.play("confetti");
            Particle.gravity = 0.7 / (64 / camera.tilesize);
            Particle.fullExplosion(
                {
                    x: (x - camera.x + 0.5) * camera.tilesize,
                    y: (y - camera.y + 0.5) * camera.tilesize,
                },
                15 / (64 / camera.tilesize),
                100,
                [
                    `hsl(${((x - camera.x) * 5 + (y - camera.y) * 5) % 360
                    },100%,50%)`,
                ],
                1 / (64 / camera.tilesize),
                50 / (64 / camera.tilesize),
            );


            gameLost = true;
            setTimeout(loseGame, 1500);
            return;
        }
    }
    rushTime = 5;
    updateLabels();
});
window.addEventListener("mousewheel", evt => {
    if (GAME_STATE === "game" && !gameLost) {
        zoom(Math.sign(evt.wheelDeltaY) * Math.log(camera.tilesize));
    }
});

const loseGame = () => {
    clearInterval(rushInterval);
    if (GAME_MODE === "normal") localStorage.setItem(storageKey("saveData"), "None");
    mines = [];
    gameLost = true;
    flavortexts = [
        "Better luck next time!",
        "Get a move on!",
        "You could do better than that...",
        "Have a nice day!",
        "That's it?",
        `Only ${score} points?`,
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
    $("#lossScreenFlavortext").innerText = flavortexts[Math.floor(flavortexts.length * Math.random())];
    $("#lossScreen").classList.add("hiddenGUIContainer");
    let flagBonus = Object.keys(minesweeperMap).filter(key => minesweeperMap[key]["#"] === -1 && minesweeperMap[key]["c"] >= 2).length;
    let bonusText = "Flag Bonus";
    if (GAME_MODE === "rush") {
        flagBonus *= 5;
        bonusText = "RUSH Flag Bonus"
    }
    $("#pointCount").innerHTML = `
        ${score} Tile Points<br />
        <span style="color: red;">+${flagBonus} ${bonusText}</span><br /><br />
        <b style="color: green;">${score + flagBonus} Points!${score > localStorage.getItem(storageKey(`highScore.${GAME_MODE}`)) ? " New High score!" : ""}<br /><br />
    `;
    if (flagBonus == 0) $("#pointCount").innerHTML = `
        <b style="color: green;">${score + flagBonus} Points!${score > localStorage.getItem(storageKey(`highScore.${GAME_MODE}`)) ? " New High score!" : ""}<br /><br />
    `;
    score += flagBonus;
    updateLabels();
    for (let x = Math.floor(camera.x); x < camera.x + CANVAS.width / camera.tilesize; x++)
        for (let y = Math.floor(camera.y); y < camera.y + CANVAS.height / camera.tilesize; y++)
            if (minesweeperMap[`${x},${y}`]["#"] === -1 && minesweeperMap[`${x},${y}`]["c"] === 1) mines.push([x, y]);
    window.thisInterval = setInterval(() => {
        if (mines.length > 0) {
            myBomb = mines[Math.floor(Math.random() * mines.length)];
            const x = myBomb[0];
            const y = myBomb[1];
            minesweeperMap[`${x},${y}`]["c"] = 0;
            Particle.fullExplosion(
                {
                    x: (x - camera.x + 0.5) * camera.tilesize,
                    y: (y - camera.y + 0.5) * camera.tilesize,
                },
                10 / (64 / camera.tilesize),
                15,
                [
                    `hsl(${((x - camera.x) * 5 + (y - camera.y) * 5) % 360
                    },100%,50%)`,
                ],
                1 / (64 / camera.tilesize),
                50 / (64 / camera.tilesize)
            );
            mines.splice(mines.indexOf(myBomb), 1);
        }
        if (mines.length <= 0) clearInterval(window.thisInterval);
    }, 50);

}

const storageKey = (d) => `edwardscamera.infinisweeper${d ? "." : ""}${d.replace(/\//g, ".")}`;

if (!localStorage.getItem(storageKey("saveData"))) localStorage.setItem(storageKey("saveData"), "None");

const saveData = () => {
    if (GAME_MODE !== "normal" || gameLost) return;
    data = `${seed},${camera.x},${camera.y},${camera.tilesize}`;
    Object.keys(minesweeperMap).forEach((key) => {
        if (minesweeperMap[key]["c"] != 1)
            data += `,${key},${minesweeperMap[key]["c"]}`;
    });
    localStorage.setItem(storageKey("saveData"), data);
};

const loadData = (dt, elm) => {
    data = dt ?? prompt("Enter save data:");
    data = data.split(",");
    seed = parseFloat(data.shift());
    camera.x = parseFloat(data.shift());
    camera.y = parseFloat(data.shift());
    camera.tilesize = parseFloat(data.shift());
    minesweeperMap = {};
    elm.innerText = "Loading 0%";
    for (let i = 0; i < data.length / 3; i++) {
        getMinesweeperMap(data[i * 3], data[i * 3 + 1], seed);
        minesweeperMap[`${data[i * 3]},${data[i * 3 + 1]}`]["c"] =
            data[i * 3 + 2];
        if (data[i * 3 + 2] > 1) flags++;
        else score++;
        elm.inerText = `Loading ${Math.round(i * 3 / data.legth) * 100}%`;
    }
    camera.canMove = true;
    elm.innerText = "Continue";
    updateLabels();
};

const newGame = (mymode) => {
    if (localStorage.getItem(storageKey(`highScore.${GAME_MODE}`)) == null) localStorage.setItem(storageKey(`highScore.${GAME_MODE}`), 0);
    updateLabels();
    GAME_MODE = mymode;
    rushTime = 5;
    $("#rushLabel").parentElement.style.display = GAME_MODE === "rush" ? "inline-block" : "none";
    flags = score = 0;
    minesweeperMap = {};
    gameLost = false;
    $("#lossScreen").classList.remove("hiddenGUIContainer");
    clearInterval(window.thisInterval);
    seed = (Math.random() - 0.5) * 2500;
    if (GAME_MODE === "normal") localStorage.setItem(storageKey("saveData"), "None");
    switchState("game");
    updateLabels();
};
const loadGame = (elm) => {
    if (
        typeof localStorage.getItem(storageKey("saveData")) != "string" ||
        !localStorage.getItem(storageKey("saveData")).includes(",")
    ) {
        elm.innerText = "No Game Saved!";
        elm.addEventListener("mouseout", () => {
            elm.innerText = "Continue";
        }, { "once": true });
        return;
    } else {
        GAME_MODE = "normal";
        $("#rushLabel").parentElement.style.display = GAME_MODE === "rush" ? "inline-block" : "none";
        loadData(localStorage.getItem(storageKey("saveData")), elm);
        switchState("game");
        updateLabels();
    }
};

const updateLabels = () => {
    $("#scoreLabel").innerText = score;
    if (localStorage.getItem(storageKey("highScore"))) {
        localStorage.setItem(storageKey("highScore.normal"), localStorage.getItem(storageKey("highScore")));
        localStorage.removeItem(storageKey("highScore"));
    }
    if (score > localStorage.getItem(storageKey(`highScore.${GAME_MODE}`)))
        localStorage.setItem(storageKey(`highScore.${GAME_MODE}`), score);
    $("#highScoreLabel").innerText = localStorage.getItem(storageKey(`highScore.${GAME_MODE}`));
    $("#flagsLabel").innerText = flags;
    $("#rushLabel").innerText = rushTime;
};

const updateLogin = () => {
    if (typeof db === "undefined" || typeof firebase === "undefined") return;
    $("#signinbtn").style.display = "none";
    $("#signoutbtn").style.display = "none";
    $("#displaynamelabel").style.display = "none";
    if (firebase.auth().currentUser) {
        $("#displayname").innerText = "Loading...";
        db.ref(`/names/${firebase.auth().getUid()}`).once('value').then(data => {
            $("#displayname").innerText = data.val();
        });
        $("#signoutbtn").style.display = "block";
        $("#displaynamelabel").style.display = "block";
    } else {
        $("#signinbtn").style.display = "block";
    }
};

const switchState = (state) => {
    GAME_STATE = state;
    Array.from($("#GUI").children).forEach((mode) => {
        mode.style.display = "none";
        if (mode.getAttribute("GAME_STATE") === GAME_STATE)
            mode.style.display = "block";
    });
    switch (GAME_STATE) {
        case "title":
            updateLogin();
            break;
    }
    Particle.particles = [];
    PoppedTile.tiles = [];
};
switchState("title");

const zoom = (size) => {
    xMiddle = camera.x + CANVAS.width / 2 / camera.tilesize;
    yMiddle = camera.y + CANVAS.height / 2 / camera.tilesize;
    camera.tilesize += size;
    camera.tilesize = Math.min(Math.max(16, camera.tilesize), 128);
    camera.x = xMiddle - CANVAS.width / 2 / camera.tilesize;
    camera.y = yMiddle - CANVAS.height / 2 / camera.tilesize;
    camera.tilesize = Math.round(camera.tilesize);
    saveData();
}

const share = (method) => {
    scoreText = `I got a new score of ${(score - 1).toString().split("").map((j) => {
        switch (parseFloat(j)) {
            case 0: return "0️⃣";
            case 1: return "1️⃣";
            case 2: return "2️⃣";
            case 3: return "3️⃣";
            case 4: return "4️⃣";
            case 5: return "5️⃣";
            case 6: return "6️⃣";
            case 7: return "7️⃣";
            case 8: return "8️⃣";
            case 9: return "9️⃣";
        }
    }).join("")} in Infinisweeper${GAME_MODE === "rush" ? " RUSH MODE" : ""}! 🚩\n\nhttps://edwardscamera.com/infinisweeper`;

    switch (method) {
        case "copy":
            if (navigator.clipboard) navigator.clipboard.writeText(scoreText);
            break;
        case "twitter":
            window.open(`https://twitter.com/intent/tweet?text=${encodeURI(scoreText)}`, "_blank");
            break;
        case "facebook":
            window.open(`http://www.facebook.com/sharer.php?s=100&p[title]=${encodeURI(scoreText)}&p[url]=https://edwardscamera.com/infinisweeper`);
            break;
    }
};

signinbtn = $("#signinbtn");
const signinfunc = (callback) => {
    if (firebase.auth().currentUser) return;

    const provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithRedirect(provider).then((result) => {
        $("#displayname").innerText = result.user.displayName;
        updateLogin();
        callback();
    }).catch((error) => {
        signinbtn.innerText = "Error";
        signinbtn.innerText = error;
        signinbtn.addEventListener("mouseout", () => {
            signinbtn.innerText = "Sign In";
        }, { "once": true, });
        console.error(error);
    });
};
signinbtn.addEventListener("click", () => signinfunc(() => { }));
signoutbtn.addEventListener("click", () => {
    if (!firebase.auth().currentUser) return;
    firebase.auth().signOut().then(() => {
        updateLogin();
    });
});
const updateDisplayName = () => {
    if (typeof db === "undefined" || typeof firebase === "undefined") return;
    if (firebase.auth().currentUser) {
        db.ref(`/names/${firebase.auth().getUid()}`).once('value').then(data => {
            myDisplayName = data.val();
        });
    } else {
        myDisplayName = "Offline";
    }
}
const onAuthStateChanged = () => {
    if (typeof db === "undefined" || typeof firebase === "undefined") return;
    updateLogin();
    if (firebase.auth().currentUser) {
        db.ref(`/names/${firebase.auth().getUid()}`).once('value').then(data => {
            if (!data.val()) {
                let username = null;
                while (!username || username == "null" || username == "undefined" || username.length > 24 || username.length < 4) username = prompt("Please choose a username (YOU CAN NOT CHANGE THIS, 4-24 characters):")
                db.ref(`/names/${firebase.auth().getUid()}`).set(username).then(() => updateDisplayName());
                updateDisplayName();
            }
        });
        $("#onlineBtn").innerText = "Upload Score";
        $("#onlineBtn").onclick = () => uploadScore();
        updateDisplayName();
    } else {
        $("#onlineBtn").innerText = "Sign In";
        $("#onlineBtn").onclick = () => signinfunc(() => { });
    }
};
const uploadScore = () => {
    if (typeof db === "undefined" || typeof firebase === "undefined") return;
    $("#onlineBtn").innerText = "Uploading...";
    const func = () => {
        db.ref(`/scores/${GAME_MODE}/${firebase.auth().getUid()}`).once('value').then((data) => {
            if (!data.val() || !data.val().hasOwnProperty("score") || score > data.val().score) {
                db.ref(`/scores/${GAME_MODE}/${firebase.auth().getUid()}`).set({
                    "uid": firebase.auth().getUid(),
                    "score": score,
                    "timestamp": (new Date()).getTime(),
                }).then(d => {
                    $("#onlineBtn").innerText = "Uploaded!";
                    $("#onlineBtn").addEventListener("mouseout", () => {
                        $("#onlineBtn").innerText = "Upload Score";
                    }, { "once": true, });
                });
            } else {
                $("#onlineBtn").innerText = "High score already uploaded!";
                $("#onlineBtn").addEventListener("mouseout", () => {
                    $("#onlineBtn").innerText = "Upload Score";
                }, { "once": true, });
            }
        });
    };
    if (!firebase.auth().currentUser) return signinfunc(func);
    else func();
}

const loadScores = () => {
    if (typeof db === "undefined" || typeof firebase === "undefined") return;
    db.ref(`scores/${"Normal".toLowerCase()}/`).orderByChild("/score").once("value", data => {
        let game_mode = "Normal";
        scores = [];
        if (!data.val() || Object.keys(data.val()).length == 0) return;
        Object.keys(data.val()).forEach(key => {
            scores.push(data.val()[key]);
        });
        scores = scores.sort((a, b) => b.score - a.score).splice(0, 10);
        $("#globalScores").innerHTML = `<div>${game_mode} Mode</div>
            <table><tbody>
                ${scores.map((j, i) => `<tr><td>#${i + 1}</td><td id="${game_mode}_${j.uid}">Loading</td><td>${j.score}</td></tr>`).join("")}
            </tbody></table>
        `;
        for (let i = 0; i < scores.length; i++) {
            db.ref(`names/${scores[i].uid}`).once('value').then(data => {
                $(`#${game_mode}_${scores[i].uid}`).innerText = data.val();
            });
        }
    }).then(() => {
        db.ref(`scores/${"Rush".toLowerCase()}/`).orderByChild("/score").once("value", data => {
            let game_mode = "Rush";
            scores = [];
            if (!data.val() || Object.keys(data.val()).length == 0) return;
            Object.keys(data.val()).forEach(key => {
                scores.push(data.val()[key]);
            });
            scores = scores.sort((a, b) => b.score - a.score).splice(0, 10);
            $("#globalScores").innerHTML += `<br /><div>${game_mode} Mode</div>
            <table><tbody>
                ${scores.map((j, i) => `<tr><td>#${i + 1}</td><td id="${game_mode}_${j.uid}">Loading</td><td>${j.score}</td></tr>`).join("")}
            </tbody></table>
        `;
            for (let i = 0; i < scores.length; i++) {
                db.ref(`names/${scores[i].uid}`).once('value').then(data => {
                    $(`#${game_mode}_${scores[i].uid}`).innerText = data.val();
                });
            }
        });
    });
};

const onFirebaseLoad = () => {
    firebase.auth().onAuthStateChanged(onAuthStateChanged);
    updateDisplayName();
    loadScores();
    setTimeout(() => Array.from(document.getElementsByClassName("onlineOnly")).forEach(elm => elm.classList.remove("onlineOnly")), 500);
};