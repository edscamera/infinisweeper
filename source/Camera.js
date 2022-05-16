import { Vector2 } from "./Util.js"

class Camera {
    constructor() {
        /** @type {Vector2} */
        this.position = new Vector2(0, 0);
        /** @type {Number} */
        this.tilesize = 64;
    }
}

export default Camera;