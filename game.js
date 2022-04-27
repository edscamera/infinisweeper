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

const bombChance = 0.20625;
let score = 0;
let lose = false;

const img = {
    "flag_icon": "./flag_icon.png",
};
Object.keys(img).forEach(key => img[key] = Object.assign(document.createElement("img"), { src: img[key] }))

const camera = {
    "tilesize": 64,
    "x": 0,
    "y": 0,
};
window.addEventListener("resize", () => {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    draw();
});

const minesweeperMap = {};
const updateTile = (x, y) => {
    if (!minesweeperMap.hasOwnProperty([`${x},${y}`])) return;
    if (minesweeperMap[`${x},${y}`]["#"] === -1) return;
    minesweeperMap[`${x},${y}`]["#"] = 0;
    for(let yy = y - 1; yy <= y + 1; yy++) {
        for(let xx = x - 1; xx <= x + 1; xx++) {
            try {
                if (!(xx === x && yy === y) && minesweeperMap[`${xx},${yy}`]["#"] === -1) minesweeperMap[`${x},${y}`]["#"]++;
            } catch (e) {}
        }
    }
};
const getMinesweeperMap = (x, y) => {
    const address = `${x},${y}`;
    
    if (!minesweeperMap.hasOwnProperty(address)) {
        minesweeperMap[address] = {
            "c": 1,
            "#": Math.random() > (1 - bombChance) ? -1 : 0,
        };
        for(let yy = y - 1; yy <= y + 1; yy++) {
            for(let xx = x - 1; xx <= x + 1; xx++) {
                updateTile(xx, yy);
            }
        }
    }
    return minesweeperMap[address];
};

const draw = () => {
    g.font = `${camera.tilesize}px roboto`;
    for(let x = Math.floor(camera.x); x < camera.x + CANVAS.width / camera.tilesize; x++) {
        for(let y = Math.floor(camera.y); y < camera.y + CANVAS.height / camera.tilesize; y++) {
            if (getMinesweeperMap(x, y)["c"] > 0) {
                g.fillStyle = Math.abs((x + y) % 2) === 0 ? "#AAD650" : "#A2D048";
                g.fillRect((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, camera.tilesize, camera.tilesize);
                if (getMinesweeperMap(x, y)["c"] === 2) {
                    g.drawImage(img.flag_icon, (x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, camera.tilesize, camera.tilesize);
                }
            } else {
                g.fillStyle = Math.abs((x + y) % 2) === 1 ? "#D7B998" : "#E4C29E";
                g.fillRect((x - camera.x) * camera.tilesize, (y - camera.y) * camera.tilesize, camera.tilesize, camera.tilesize);
                g.fillStyle = "#000";
                switch(getMinesweeperMap(x, y)["#"]) {
                    case 1: g.fillStyle = "#1977D3"; break;
                    case 2: g.fillStyle = "#3B8E3F"; break;
                    case 3: g.fillStyle = "#D53734"; break;
                    case 4: g.fillStyle = "#7A1EA2"; break;
                    case 5: g.fillStyle = "#1977D3"; break;
                    case 6: g.fillStyle = "#000000"; break;
                    case 7: g.fillStyle = "#FF0000"; break;
                    case 8: g.fillStyle = "#000000"; break;
                }
                if (getMinesweeperMap(x, y)["#"] > 0) {
                    g.fillText(
                        getMinesweeperMap(x, y)["#"],
                        (x - camera.x + 0.5) * camera.tilesize - g.measureText(getMinesweeperMap(x, y)["#"]).width / 2,
                        (y - camera.y + 0.375) * camera.tilesize + camera.tilesize / 2,
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
    g.fillStyle = "#000";
    btns.forEach(btn => {
        g.fillText(btn.t, btn.x, btn.y);
        if (!lose && (btn.x - Input.mouse.position.x) ** 2 + (btn.y - Input.mouse.position.y) ** 2 < 50 ** 2) btn.func();
    });
    g.fillText(`Score: ${score}`, 15, CANVAS.height - 20);
};

const update = () => {
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

window.addEventListener("contextmenu", (evt) => evt.preventDefault());
let clicks = 0;
window.addEventListener("mousedown", (evt) => {
    if (lose) return;
    const x = Math.floor((camera.x * camera.tilesize + Input.mouse.position.x) / camera.tilesize);
    const y = Math.floor((camera.y * camera.tilesize + Input.mouse.position.y) / camera.tilesize);
    if(evt.button === 2) {
        switch(getMinesweeperMap(x, y)["c"]) {
            case 1:
                minesweeperMap[`${x},${y}`]["c"] = 2;
                break;
            case 2:
                minesweeperMap[`${x},${y}`]["c"] = 1;
                break;
        }
    }
    if(evt.button === 0) {
        clicks++;

        let leftToEmpty = [[x, y]];

        if (clicks === 1) {
            leftToEmpty = [];
            minesweeperMap[`${x},${y}`]["#"] = 0;
            for(let yy = y - 1; yy <= y + 1; yy++) {
                for(let xx = x - 1; xx <= x + 1; xx++) {
                    updateTile(xx, yy);
                    getMinesweeperMap(xx, yy);
                    minesweeperMap[`${xx},${yy}`]["c"] = minesweeperMap[`${xx},${yy}`]["#"] === -1 ? 1 : 0;
                    if (minesweeperMap[`${xx},${yy}`]["#"] !== -1) {
                        leftToEmpty.push([xx, yy]);
                        score++;
                    }
                }
            }
        }

        let cycles = 0;
        while(leftToEmpty.length > 0) {
            const x2 = Math.floor(leftToEmpty[0][0]);
            const y2 = Math.floor(leftToEmpty[0][1]);
            if (minesweeperMap[`${x2},${y2}`]["c"] === 1) score++;
            minesweeperMap[`${x2},${y2}`]["c"] = 0;
            for(let xoffset = -1; xoffset <= 1; xoffset++) {
                for(let yoffset = -1; yoffset <= 1; yoffset++) {
                    if (getMinesweeperMap(x2 + xoffset, y2 + yoffset)["c"] === 1 && getMinesweeperMap(x2, y2)["#"] === 0) leftToEmpty.push([x2 + xoffset, y2 + yoffset]);
                }
            }
            leftToEmpty = leftToEmpty.slice(1);
            cycles++;
            if (cycles > 500) break;
        }

        if (minesweeperMap[`${x},${y}`]["#"] === -1) {
            lose = true;
            for(let x = Math.floor(camera.x); x < camera.x + CANVAS.width / camera.tilesize; x++) {
                for(let y = Math.floor(camera.y); y < camera.y + CANVAS.height / camera.tilesize; y++) {
                    if (minesweeperMap[`${x},${y}`]["#"] === -1) minesweeperMap[`${x},${y}`]["c"] = 0;
                }
            }
            return;
        }
    }
});

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