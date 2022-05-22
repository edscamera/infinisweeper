import Settings from "./Settings.js";
import { Vector2 } from "./Util.js"

class Camera {
    constructor(cameraControls) {
        /** @type {Vector2} */
        this.position = new Vector2(0, 0);
        /** @type {Number} */
        this.tilesize = 64;
        this.targetTilesize = null;

        this.centered = null;

        this.cameraControls = cameraControls;
        this.scaling = false;
    }

    initializeControls(canvas) {
        canvas.addEventListener("mousedown", () => {
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
        canvas.addEventListener("touchstart", () => {
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

        window.addEventListener("wheel", (event) => {
            if (!this.cameraControls) return;
            this.setTilesize(Math.max(this.tilesize + Math.sign(event.deltaY) * -5, 14));
        });

        window.addEventListener("touchstart", (event) => {
            if (!this.cameraControls) return;
            if (event.touches.length === 2) {
                const originalTilesize = this.tilesize;
                const originalPinch = Math.hypot(
                    event.touches[0].pageX - event.touches[1].pageX,
                    event.touches[0].pageY - event.touches[1].pageY) / 2;
                const pinch = (event) => {
                    event.preventDefault();
                    const newPinch = Math.hypot(
                        event.touches[0].pageX - event.touches[1].pageX,
                        event.touches[0].pageY - event.touches[1].pageY) / 2;
                    this.setTilesize(originalTilesize + (newPinch - originalPinch));
                };
                window.addEventListener("touchmove", pinch);
                window.addEventListener("touchend", () => {
                    window.removeEventListener("touchmove", pinch);
                }, { "once": true, });
            }
        });
    }

    setTilesize(tilesize, focus) {
        const middleX = focus ? focus.x : (this.position.x + window.innerWidth / 2 / this.tilesize);
        const middleY = focus ? focus.y : (this.position.y + window.innerHeight / 2 / this.tilesize);

        this.tilesize = Math.round(tilesize);
        this.tilesize = Math.max(16, this.tilesize);

        this.position.x = (focus ? focus.x : middleX) - window.innerWidth / 2 / this.tilesize;
        this.position.y = (focus ? focus.y : middleY) - window.innerHeight / 2 / this.tilesize;
    }

    shake(time) {
        if (!Settings.settings.cameraShake) return;
        let shakeInterval = window.setInterval(() => {
            this.position.x += (Math.random() - 0.5) * 0.1;
            this.position.y += (Math.random() - 0.5) * 0.1;
        });
        window.setTimeout(() => clearInterval(shakeInterval), time * 1000);
    }

    updateTilesize() {
        if (this.targetTilesize) this.setTilesize(this.tilesize + (this.targetTilesize - this.tilesize) / 15);

        if (this.centered) {
            this.targetPosition = {
                "x": (this.centered.right + this.centered.left) / 2 - window.innerWidth / 2 / this.targetTilesize,
                "y": (this.centered.bottom + this.centered.top) / 2 - window.innerHeight / 2 / this.targetTilesize,
            };
            this.position.x += (this.targetPosition.x - this.position.x) / 15;
            this.position.y += (this.targetPosition.y - this.position.y) / 15;
        }
    }
}

export default Camera;