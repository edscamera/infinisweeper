const CANVAS = document.createElement("canvas");
const g = CANVAS.getContext("2d");
document.body.appendChild(CANVAS);

window.addEventListener("load", () => {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    window.setInterval(() => {
        g.fillStyle = "#fff";
        g.fillRect(0, 0, CANVAS.width, CANVAS.height);

        update();
        draw();
    }, 1000 / 60);
    Input.initialize();
});

let seed = (Math.random() - 0.5) * 2500;
const bombChance = 0.15;
let score = 0;
let flags = 0;
let lose = false;

class PoppedTile {
    static tiles = [];
    constructor(x, y, type) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.rotationVel = 0;
        this.velocity = {
            "x": (Math.random() - 0.5) * 10,
            "y": -Math.random() * 10,
        };
        this.size = camera.tilesize;
        PoppedTile.tiles.push(this);
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.2;
        this.rotation += this.rotationVel;
        this.rotationVel += 0.005 * Math.sign(this.velocity.x);
    }
    draw() {
        g.save();
        g.translate(this.x - camera.x * camera.tilesize + this.size / 2, this.y - camera.y * camera.tilesize + this.size / 2);
        g.rotate(this.rotation);
        if (this.type === 0) {
            g.fillStyle = "#AAD650";
            g.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        if (this.type === 1) {
            g.fillStyle = "#A2D048";
            g.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        if (this.type === 2) {
            g.drawImage(img.flag_icon, -this.size / 2, -this.size / 2, this.size, this.size);
        }
        g.restore();
        this.size *= 0.99;
        if (this.size <= 1) PoppedTile.tiles.splice(PoppedTile.tiles.indexOf(this), 1);
    }
}

const img = {
    "flag_icon": "./flag_icon.png",
    "flag_gif": "https://www.google.com/logos/fnbx/minesweeper/flag_plant.png",
};
Object.keys(img).forEach(key => img[key] = Object.assign(document.createElement("img"), { src: img[key] }))

const camera = {
    "tilesize": 64,
    "x": 0,
    "y": 0,
};
window.bombs = [];
window.addEventListener("resize", () => {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    draw();
});

let minesweeperMap = {};
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
            "c": 1,
            //"#": (noise.simplex2(x, y) + 1) / 2 > (1 - bombChance) ? -1 : 0,
            "#": prng(parseFloat(x) * 1000 + parseFloat(y), parseFloat(seed)) > (1 - bombChance) ? -1 : 0,
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
    g.font = `${camera.tilesize / (64 / 48)}px roboto`;
    for (let x = Math.floor(camera.x); x < camera.x + CANVAS.width / camera.tilesize; x++) {
        for (let y = Math.floor(camera.y); y < camera.y + CANVAS.height / camera.tilesize; y++) {
            if (getMinesweeperMap(x, y)["c"] > 0) {
                g.fillStyle = Math.abs((x + y) % 2) === 0 ? "#AAD650" : "#A2D048";
                g.fillRect((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, camera.tilesize, camera.tilesize);
                if (getMinesweeperMap(x, y)["c"] >= 9) {
                    g.drawImage(img.flag_icon, (x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, camera.tilesize, camera.tilesize);
                }
                if (getMinesweeperMap(x, y)["c"] >= 2 && getMinesweeperMap(x, y)["c"] < 9) {
                    minesweeperMap[`${x},${y}`]["c"] += 0.5;
                    g.drawImage(img.flag_gif, 1, 81 * (Math.floor(minesweeperMap[`${x},${y}`]["c"]) - 2), 81, 80, (x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, camera.tilesize, camera.tilesize);
                }
            } else {
                g.fillStyle = Math.abs((x + y) % 2) === 1 ? "#D7B998" : "#E4C29E";
                g.fillRect((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, camera.tilesize, camera.tilesize);

                g.strokeStyle = "#86AE3A";
                g.lineWidth = camera.tilesize / (64 / 15) / 2;
                g.beginPath();
                const condition = (x, y) => (getMinesweeperMap(x, y)["c"] === 0 && getMinesweeperMap(x, y)["#"] === -1) || getMinesweeperMap(x, y)["c"] > 0
                if (condition(x + 1, y)) {
                    g.moveTo((x - camera.x + 1) * camera.tilesize - g.lineWidth / 2, (y - camera.y) * camera.tilesize);
                    g.lineTo((x - camera.x + 1) * camera.tilesize - g.lineWidth / 2, (y - camera.y + 1) * camera.tilesize);
                }
                if (condition(x - 1, y)) {
                    g.moveTo((x - camera.x) * camera.tilesize + g.lineWidth / 2, (y - camera.y) * camera.tilesize);
                    g.lineTo((x - camera.x) * camera.tilesize + g.lineWidth / 2, (y - camera.y + 1) * camera.tilesize);
                }
                if (condition(x, y + 1)) {
                    g.moveTo((x - camera.x) * camera.tilesize, (y - camera.y + 1) * camera.tilesize - g.lineWidth / 2);
                    g.lineTo((x - camera.x + 1) * camera.tilesize, (y - camera.y + 1) * camera.tilesize - g.lineWidth / 2);
                }
                if (condition(x, y - 1)) {
                    g.moveTo((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize + g.lineWidth / 2);
                    g.lineTo((x - camera.x + 1) * camera.tilesize, (y - camera.y) * camera.tilesize + g.lineWidth / 2);
                }
                g.stroke();

                g.fillStyle = "#86AE3A";
                if (condition(x - 1, y - 1)) g.fillRect((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, g.lineWidth, g.lineWidth);
                if (condition(x + 1, y + 1)) g.fillRect((x - camera.x + 1) * camera.tilesize - g.lineWidth, (y - camera.y + 1) * camera.tilesize - g.lineWidth, g.lineWidth, g.lineWidth);
                if (condition(x + 1, y - 1)) g.fillRect((x - camera.x + 1) * camera.tilesize - g.lineWidth, (y - camera.y) * camera.tilesize, g.lineWidth, g.lineWidth);
                if (condition(x - 1, y + 1)) g.fillRect((x - camera.x) * camera.tilesize, (y - camera.y + 1) * camera.tilesize - g.lineWidth, g.lineWidth, g.lineWidth);

                g.fillStyle = "#000";
                switch (getMinesweeperMap(x, y)["#"]) {
                    case 1: g.fillStyle = "#1977D3"; break;
                    case 2: g.fillStyle = "#3B8E3F"; break;
                    case 3: g.fillStyle = "#D53734"; break;
                    case 4: g.fillStyle = "#7A1EA2"; break;
                    case 5: g.fillStyle = "#FF8F00"; break;
                    case 6: g.fillStyle = "#159AA4"; break;
                    case 7: g.fillStyle = "#424343"; break;
                    case 8: g.fillStyle = "#A99D93"; break;
                }

                const metrics = g.measureText(getMinesweeperMap(x, y)["#"])
                const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

                if (getMinesweeperMap(x, y)["#"] > 0) {
                    g.fillText(
                        getMinesweeperMap(x, y)["#"],
                        (x - camera.x + 0.5) * camera.tilesize - metrics.width / 2,
                        (y - camera.y + 0.5) * camera.tilesize + textHeight * 0.5,
                        camera.tilesize
                    );
                }
                if (getMinesweeperMap(x, y)["#"] === -1) {
                    g.fillStyle = `hsl(${((x - camera.x) * 5 + (y - camera.y) * 5) % 360},100%,50%)`;
                    g.fillRect((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, camera.tilesize, camera.tilesize);
                    g.fillStyle = "#000";
                    g.beginPath();
                    g.ellipse((x - camera.x + 0.5) * camera.tilesize, (y - camera.y + 0.5) * camera.tilesize, camera.tilesize / 4, camera.tilesize / 4, 0, 0, Math.PI * 2);
                    g.fill();
                }
            }
        }
    }

    g.font = "32px roboto";
    const btns = [
        {
            "t": "<",
            "x": 15,
            "y": CANVAS.height / 2,
            "func": () => camera.x -= 0.2,
        },
        {
            "t": ">",
            "x": CANVAS.width - 15 - g.measureText(">").width,
            "y": CANVAS.height / 2,
            "func": () => camera.x += 0.2,
        },
        {
            "t": "v",
            "x": CANVAS.width / 2 - g.measureText(">").width / 2,
            "y": CANVAS.height - 15,
            "func": () => camera.y += 0.2,
        },
        {
            "t": "^",
            "x": CANVAS.width / 2 - g.measureText(">").width / 2,
            "y": camera.tilesize,
            "func": () => camera.y -= 0.2,
        }
    ]
    PoppedTile.tiles.forEach(tile => tile.draw());
    Particle.particles.forEach(p => p.draw());
    g.fillStyle = "#000";
    btns.forEach(btn => {
        g.fillText(btn.t, btn.x, btn.y);
        if (!lose && (btn.x - Input.mouse.position.x) ** 2 + (btn.y - Input.mouse.position.y) ** 2 < 50 ** 2) btn.func();
    });
    g.fillText(`Score: ${score}`, 15, CANVAS.height - 20);
    g.fillText(`Flags:${flags}`, 15, CANVAS.height - 64)
};

const update = () => {
    Particle.particles.forEach(p => p.update());
    PoppedTile.tiles.forEach(tile => tile.update());
    if (lose) return;
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
};

CANVAS.addEventListener("contextmenu", (evt) => evt.preventDefault());
let clicks = 0;
mousedown = false;
dragging = false;
CANVAS.addEventListener("mousedown", (evt) => {
    mousedown = true;
    yeOlX = Input.mouse.position.x;
    yeOlY = Input.mouse.position.y;
    setTimeout(() => {
        difference = Math.sqrt((yeOlX - Input.mouse.position.x) ** 2 + (yeOlY - Input.mouse.position.y) ** 2);
        if (mousedown && difference > 5) dragging = true;
    }, 50);
});
CANVAS.addEventListener("mousemove", (evt) => {
    if (dragging && !lose) {
        camera.x -= evt.movementX / camera.tilesize;
        camera.y -= evt.movementY / camera.tilesize;
    }
});
CANVAS.addEventListener("mouseup", (evt) => {
    mousedown = false;
    if (dragging) return dragging = false;
    if (lose) return;
    const x = Math.floor((camera.x * camera.tilesize + Input.mouse.position.x) / camera.tilesize);
    const y = Math.floor((camera.y * camera.tilesize + Input.mouse.position.y) / camera.tilesize);

    if (evt.button === 2) {
        if (getMinesweeperMap(x, y)["c"] === 1) {
            minesweeperMap[`${x},${y}`]["c"] = 2;
            flags++;
        } else if (getMinesweeperMap(x, y)["c"] >= 2) {
            new PoppedTile(x * camera.tilesize, y * camera.tilesize, 2);
            minesweeperMap[`${x},${y}`]["c"] = 1;
            flags--;
        }
    }

    if (evt.button === 0) {
        clicks++;

        let leftToEmpty = [[x, y]];
        if (minesweeperMap[`${x},${y}`]["c"] >= 2) return;

        if (clicks === 1) {
            leftToEmpty = [];
            minesweeperMap[`${x},${y}`]["#"] = 0;
            for (let yy = y - 1; yy <= y + 1; yy++) {
                for (let xx = x - 1; xx <= x + 1; xx++) {
                    updateTile(xx, yy);
                    getMinesweeperMap(xx, yy);
                    if (minesweeperMap[`${xx},${yy}`]["c"] === 1) {
                        minesweeperMap[`${xx},${yy}`]["c"] = minesweeperMap[`${xx},${yy}`]["#"] === -1 ? 1 : 0;

                        if (minesweeperMap[`${xx},${yy}`]["c"] === 0) new PoppedTile(xx * camera.tilesize, yy * camera.tilesize, Math.abs((xx + yy) % 2));
                        if (minesweeperMap[`${xx},${yy}`]["#"] !== -1) {
                            leftToEmpty.push([xx, yy]);
                            score++;
                        }
                    }
                }
            }
        }

        let cycles = 0;
        while (leftToEmpty.length > 0) {
            const x2 = Math.floor(leftToEmpty[0][0]);
            const y2 = Math.floor(leftToEmpty[0][1]);
            if (minesweeperMap[`${x2},${y2}`]["c"] === 1) {
                score++;
                new PoppedTile(x2 * camera.tilesize, y2 * camera.tilesize, Math.abs((x2 + y2) % 2));
            }
            minesweeperMap[`${x2},${y2}`]["c"] = 0;
            for (let xoffset = -1; xoffset <= 1; xoffset++) {
                for (let yoffset = -1; yoffset <= 1; yoffset++) {
                    if (getMinesweeperMap(x2 + xoffset, y2 + yoffset)["c"] === 1 && getMinesweeperMap(x2, y2)["#"] === 0) leftToEmpty.push([x2 + xoffset, y2 + yoffset]);
                }
            }

            leftToEmpty = leftToEmpty.slice(1);
            cycles++;
            if (cycles > 1500) break;
        }
        if (cycles > 30) {
            const shake = setInterval(() => {
                camera.x += (Math.random() - 0.5) * 0.4;
                camera.y += (Math.random() - 0.5) * 0.4;
            }, 10);
            setTimeout(() => clearInterval(shake), 400);
        }

        if (minesweeperMap[`${x},${y}`]["#"] === -1) {
            Particle.explosion((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, 50, 50, [`hsl(${((x - camera.x) * 5 + (y - camera.y) * 5) % 360},100%,50%)`], 1, 50)
            lose = true;
            window.bombs = [];
            for (let x = Math.floor(camera.x); x < camera.x + CANVAS.width / camera.tilesize; x++) {
                for (let y = Math.floor(camera.y); y < camera.y + CANVAS.height / camera.tilesize; y++) {
                    if (minesweeperMap[`${x},${y}`]["#"] === -1 && minesweeperMap[`${x},${y}`]["c"] === 1) window.bombs.push([x, y]);
                }
            }
            return;
        }
    }
});

window.setInterval(() => {
    if (window.bombs.length > 0) {
        myBomb = window.bombs[Math.floor(Math.random() * window.bombs.length)];
        const x = myBomb[0];
        const y = myBomb[1];
        minesweeperMap[`${x},${y}`]["c"] = 0;
        Particle.explosion((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, 50, 50, [`hsl(${((x - camera.x) * 5 + (y - camera.y) * 5) % 360},100%,50%)`], 1, 50);
        window.bombs.splice(window.bombs.indexOf(myBomb), 1);
    }
}, 50);

class Input {
    static keyDown = {};
    static mouse = {
        "position": {
            "x": 0,
            "y": 0,
        },
        "relativePosition": {
            "x": 0,
            "y": 0,
        }
    }
    static initialize() {
        window.addEventListener("mousemove", evt => {
            this.mouse.position.x = evt.clientX;
            this.mouse.position.y = evt.clientY;
            this.mouse.relativePosition.x = evt.clientX / CANVAS.width;
            this.mouse.relativePosition.y = evt.clientY / CANVAS.height;
        });
        window.addEventListener("keydown", evt => this.keyDown[evt.key] = true);
        window.addEventListener("keyup", evt => this.keyDown[evt.key] = false);
    }
}

class Particle {
    static particles = [];
    static explosion(x, y, velocity, amount, colors, minSize, maxSize) {
        for (let i = 0; i < amount; i++) {
            const myColor = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(
                new Particle(
                    x,
                    y,
                    velocity,
                    myColor,
                    minSize + (maxSize - minSize) * Math.random()
                )
            )
        }
    }
    constructor(x, y, velocity, color, size) {
        this.color = color;
        this.size = size;
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.rotationVel = 0;
        this.velocity = {
            "x": Math.cos(Math.PI * 2 * Math.random()) * (Math.random() * velocity - velocity / 2),
            "y": Math.sin(Math.PI * 2 * Math.random()) * (Math.random() * velocity - velocity / 2),
        }
        window.setTimeout(() => {
            Particle.particles.splice(Particle.particles.indexOf(this), 1);
        }, 5 * 1000);

    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.7;
        this.rotation += this.rotationVel;
        this.rotationVel += 0.005;
        if (this.x < 0 || this.x > CANVAS.width || this.y > CANVAS.height) Particle.particles.splice(Particle.particles.indexOf(this), 1);
    }
    draw() {
        g.fillStyle = this.color;
        g.save();
        g.translate(this.x, this.y);
        g.rotate(this.rotation);
        g.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        g.restore();
    }
}

function prng(a, seed) {
    a = parseFloat(a);
    seed = parseFloat(seed);
    a *= seed;
    return (function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    })()
}

const saveData = (elm) => {
    elm.innerText = "Copying...";
    if (!navigator.clipboard) {
        elm.innerText = "Save Game";
        return alert("There was an error copying save data.\n\nNo Clipboard Detected");
    }
    data = `${seed}`;
    Object.keys(minesweeperMap).forEach(key => {
        if (minesweeperMap[key]["c"] != 1) data += `,${key},${minesweeperMap[key]["c"]}`;
    });
    navigator.clipboard.writeText(data).then(() => {
        elm.innerText = "Copied!";
        setTimeout(() => elm.innerText = "Save Game", 1000);
    }, (err) => {
        alert(`There was an error copying save data.\n\n${err}`);
        elm.innerText = "Save Game";
    });
}
const loadData = (elm) => {
    data = prompt("Enter save data:");
    data = data.split(",");
    seed = parseFloat(data.shift());
    minesweeperMap = {};
    console.log(minesweeperMap);
    for (let i = 0; i < data.length / 3; i++) {
        getMinesweeperMap(data[i * 3], data[i * 3 + 1], seed);
        minesweeperMap[`${data[i * 3]},${data[i * 3 + 1]}`]["c"] = data[i * 3 + 2];
        if (data[i * 3 + 2] > 1) flags++;
        else score++;
    }
}