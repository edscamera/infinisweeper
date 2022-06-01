import Settings from "./Settings.js";
/**
 * Returns a pseudo-random number derived from a value and a seed.
 * @param {Number} value
 * @param {Number} seed 
 * @returns {number}
 */
export function prng(value, seed) {
    value = parseFloat(value);
    seed = parseFloat(seed);
    value *= seed;
    return (function () {
        var t = (value += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    })();
};

export function $(selector) {
    let ret = null;
    if (selector[0] === ".") ret = Array.from(document.getElementsByClassName(selector.slice(1)));
    else if (selector[0] === "#") ret = document.querySelector(selector);
    else ret = Array.from(document.getElementsByTagName(selector));
    if (Array.isArray(ret) && ret.length === 1) return ret[0];
    return ret;
}

export function deviceType() {
    const ua = navigator.userAgent;

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "mobile";
    }
    else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }
    return "desktop";
};

export class Vector2 {
    /**
     * Represents an ordered pair.
     * @constructor
     * @param {Number} x 
     * @param {Number} y 
     */
    constructor(x, y) {
        /** @type {Number} */
        this.x = x ?? 0;
        /** @type {Number} */
        this.y = y ?? 0;
    }
}

export class Input {
    static mouse = {
        position: {
            "x": 0,
            "y": 0,
        }
    };
    static keyDown = {};
    static initialize() {
        window.addEventListener("mousemove", (evt) => {
            this.mouse.position = {
                "x": evt.pageX,
                "y": evt.pageY,
            }
        });
        window.addEventListener("keydown", (evt) => Input.keyDown[evt] = true);
        window.addEventListener("keyup", (evt) => Input.keyDown[evt] = false);
    }
}

export class Image {
    static imageList = {};
    static add(name, url) {
        if (Image.imageList.hasOwnProperty(name)) return null;
        Image.imageList[name] = Object.assign(
            document.createElement("img"),
            { "src": url, }
        );
        return Image.imageList[name];
    }
    static get(name) {
        return Image.imageList.hasOwnProperty(name) ? Image.imageList[name] : null;
    }
}

export class SoundEffect {
    static audioList = {};
    static add(name, url) {
        if (SoundEffect.audioList.hasOwnProperty(name)) return null;
        SoundEffect.audioList[name] = url;
    }
    static play(name) {
        if (!Settings.settings.muted) new Audio(SoundEffect.audioList[name]).play();
    }
}

export class Particle {
    static particles = [];
    static decayRate = 5000;
    static explosion(camera, position, velocity, amount, colors, minSize, maxSize) {
        if (!Settings.settings.drawParticles) return;
        for (let i = 0; i < amount; i++) {
            const myColor = colors[Math.floor(Math.random() * colors.length)];
            const myDir = Math.PI * 2 * Math.random();
            this.particles.push(new Particle(
                camera,
                { ...position },
                {
                    "x": Math.cos(myDir) * velocity,
                    "y": Math.sin(myDir) * velocity,
                },
                myColor,
                minSize + (maxSize - minSize) * Math.random(),
            ));
        }
    }
    static fullExplosion(camera, position, velocity, amount, colors, minSize, maxSize) {
        if (!Settings.settings.drawParticles) return;
        for (let i = 0; i < amount; i++) {
            const myColor = colors[Math.floor(Math.random() * colors.length)];
            const myDir = Math.PI * 2 * Math.random();
            this.particles.push(new Particle(
                camera,
                { ...position },
                {
                    "x": Math.cos(myDir) * velocity * Math.random(),
                    "y": Math.sin(myDir) * velocity * Math.random(),
                },
                myColor,
                minSize + (maxSize - minSize) * Math.random()
            ));
        }
    }
    constructor(camera, position, velocity, color, size) {
        if (!Settings.settings.drawParticles) return;
        this.camera = camera;
        this.position = position;
        this.velocity = velocity;

        this.color = color;
        this.size = size;

        this.position.x -= this.size / 2;
        this.position.y -= this.size / 2;

        this.rotation = Math.PI * 2 * Math.random();
        this.rotationVel = 0;

        this.dead = false;
        window.setTimeout(() => this.dead = true, Particle.decayRate);

    }
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.y += 0.2 / this.camera.tilesize;
        this.rotation += this.rotationVel;
        if (this.rotationVel < 0.1) this.rotationVel += 0.005;
        const x = (this.position.x - this.camera.position.x) * this.camera.tilesize + this.size / 2;
        const y = (this.position.y - this.camera.position.y) * this.camera.tilesize + this.size / 2;
        if (
            x < -this.size ||
            x > window.innerWidth + this.size ||
            y > window.innerHeight + this.size
        ) this.dead = true;
    }
    draw(g) {
        g.fillStyle = this.color;
        g.save();
        g.translate(
            (this.position.x - this.camera.position.x + (this.size / 2)) * this.camera.tilesize,
            (this.position.y - this.camera.position.y + (this.size / 2)) * this.camera.tilesize
        );
        g.rotate(this.rotation);
        g.fillRect(-this.size / 2 * this.camera.tilesize, -this.size / 2 * this.camera.tilesize, this.size * this.camera.tilesize, this.size * this.camera.tilesize);
        g.restore();
    }
    static updateAllParticles() {
        Particle.particles.forEach(p => p.update());
        Particle.particles = Particle.particles.filter(p => !p.dead);
    }
    static drawAllParticles(g) {
        Particle.particles.forEach(p => p.draw(g));
    }
}