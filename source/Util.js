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
    static imageList = { };
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