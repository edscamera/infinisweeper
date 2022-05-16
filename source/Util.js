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