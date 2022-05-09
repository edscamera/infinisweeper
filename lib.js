window.addEventListener("load", () => {
    // Load all images in dictionary
    if (typeof (img) === "object") Object.keys(img).forEach(key => img[key] = Object.assign(document.createElement("img"), { src: img[key] }));
    if (typeof (sfx) === "object") Object.keys(sfx).forEach(key => sfx[key] = new Audio(sfx[key]));
});

// Input System
class Input {
    static keyDown = {};
    static mouse = {
        "position": {
            "x": 0,
            "y": 0,
        },
        "buttons": {
            0: false,
            1: false,
            2: false,
        },
        "relativePosition": {
            "x": 0,
            "y": 0,
        }
    }
    static touch = false;
    static swipe = {
        "x": 0,
        "y": 0,
    }
    static previousTouch = null;
    static initialize() {
        window.addEventListener("mousemove", evt => {
            this.mouse.position.x = evt.clientX;
            this.mouse.position.y = evt.clientY;
            this.mouse.relativePosition.x = evt.clientX / CANVAS.width;
            this.mouse.relativePosition.y = evt.clientY / CANVAS.height;
        });
        window.addEventListener("mousedown", evt => this.mouse.buttons[evt.button] = true);
        window.addEventListener("mouseup", evt => this.mouse.buttons[evt.button] = false);
        window.addEventListener("touchstart", evt => this.touch = true);
        window.addEventListener("touchmove", evt => {
            const touch = evt.touches[0];
            if (this.previousTouch) {
                this.swipe.x = touch.clientX - this.previousTouch.clientX;
                this.swipe.y = touch.clientY - this.previousTouch.clientY;
            }
            this.previousTouch = touch;
        });
        window.addEventListener("touchend", evt => {
            this.touch = false;
            this.previousTouch = null;
        });
        window.addEventListener("keydown", evt => this.keyDown[evt.key] = true);
        window.addEventListener("keyup", evt => this.keyDown[evt.key] = false);
    }
}


// Particle System 2.0
class Particle {
    static particles = [];
    static decayRate = 5000;
    static gravity = 0.7;
    static explosion(position, velocity, amount, colors, minSize, maxSize) {
        for (let i = 0; i < amount; i++) {
            const myColor = colors[Math.floor(Math.random() * colors.length)];
            const myDir = Math.PI * 2 * Math.random();
            this.particles.push(new Particle(
                { ...position },
                {
                    "x": Math.cos(myDir) * velocity,
                    "y": Math.sin(myDir) * velocity,
                },
                myColor,
                minSize + (maxSize - minSize) * Math.random()
            ));
        }
    }
    static fullExplosion(position, velocity, amount, colors, minSize, maxSize) {
        for (let i = 0; i < amount; i++) {
            const myColor = colors[Math.floor(Math.random() * colors.length)];
            const myDir = Math.PI * 2 * Math.random();
            this.particles.push(new Particle(
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
    constructor(position, velocity, color, size) {
        this.position = position;
        this.velocity = velocity;

        this.color = color;
        this.size = size;

        this.rotation = Math.PI * 2 * Math.random();
        this.rotationVel = 0;

        this.dead = false;
        window.setTimeout(() => this.dead = true, Particle.decayRate);

    }
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.y += Particle.gravity;
        this.rotation += this.rotationVel;
        if (this.rotationVel < 0.1) this.rotationVel += 0.005;
        if (
            this.position.x < -this.size ||
            this.position.x > CANVAS.width + this.size ||
            this.position.y > CANVAS.height + this.size
        ) Particle.particles.splice(Particle.particles.indexOf(this), 1);
    }
    draw() {
        g.fillStyle = this.color;
        g.save();
        g.translate(this.position.x, this.position.y);
        g.rotate(this.rotation);
        g.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        g.restore();
    }
    static updateAllParticles() {
        Particle.particles.forEach(p => p.update());
        Particle.particles = Particle.particles.filter(p => !p.dead);
    }
    static drawAllParticles() {
        Particle.particles.forEach(p => p.draw());
    }
}

const prng = (a, seed) => {
    a = parseFloat(a);
    seed = parseFloat(seed);
    a *= seed;
    return (function () {
        var t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    })();
};