import Settings from "./Settings.js";
import { Vector2 } from "./Util.js"

class Camera {
    constructor(cameraControls) {
        /** @type {Vector2} */
        this.position = new Vector2(0, 0);
        /** @type {Number} */
        this.tilesize = 64;

        this.cameraControls = cameraControls;
        window.addEventListener("mousedown", () => {
            if (!this.cameraControls) return;
            let lockedToDrag = false;
            const mouseMove = (event) => {
                if (lockedToDrag || Math.abs(event.movementX) + Math.abs(event.movementY) > Settings.settings.dragSensitivity) {
                    lockedToDrag = true;
                    this.position.x -= event.movementX / this.tilesize;
                    this.position.y -= event.movementY / this.tilesize;
                }
            };
            window.addEventListener("mousemove", mouseMove);
            window.addEventListener("mouseup", () => {
                window.removeEventListener("mousemove", mouseMove);
            }, { "once": true, });
        });

        this.oldTouchData = null;
        window.addEventListener("touchstart", () => {
            if (!this.cameraControls) return;
            let oldTouchData = null;
            let lockedToDrag = false;
            const touchMove = (event) => {
                event.preventDefault();

                event.movementX = oldTouchData ? event.touches[0].pageX - oldTouchData.x : 0;
                event.movementY = oldTouchData ? event.touches[0].pageY - oldTouchData.y : 0;

                if (lockedToDrag || Math.abs(event.movementX) + Math.abs(event.movementY) > 5) {
                    lockedToDrag = true;
                    this.position.x -= event.movementX / this.tilesize;
                    this.position.y -= event.movementY / this.tilesize;
                }

                oldTouchData = {
                    "x": event.touches[0].pageX,
                    "y": event.touches[0].pageY,
                };
            }
            window.addEventListener("touchmove", touchMove);
            window.addEventListener("touchend", () => {
                window.removeEventListener("touchmove", touchMove);
            });
            window.addEventListener("touchcancel", () => {
                window.removeEventListener("touchmove", touchMove);
            });
        });

    }
}

export default Camera;