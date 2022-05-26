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

        this.pinchZoom = 0;
    }

    initializeControls(canvas) {
        const deviceType = () => {
            const ua = navigator.userAgent;

            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return "mobile";
            }
            else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                return "mobile";
            }
            return "desktop";
        };
        if (deviceType() === "desktop") {
            canvas.addEventListener("mousedown", () => {
                if (!this.cameraControls) return;
                this.lockedToDrag = false;
                const mouseMove = (event) => {
                    if (this.lockedToDrag || Math.abs(event.movementX) + Math.abs(event.movementY) > Settings.settings.dragSensitivity) {
                        this.lockedToDrag = true;
                        this.position.x -= event.movementX / this.tilesize;
                        this.position.y -= event.movementY / this.tilesize;
                    }
                };
                window.addEventListener("mousemove", mouseMove);
                window.addEventListener("mouseup", () => {
                    window.removeEventListener("mousemove", mouseMove);
                }, { "once": true, });
            });
        }

        this.oldTouchData = null;
        canvas.addEventListener("touchstart", (event) => {
            event.preventDefault();
            if (!this.cameraControls) return;
            let oldTouchData = null;
            this.lockedToDrag = false;
            const touchMove = (event) => {
                event.movementX = oldTouchData ? event.touches[0].pageX - oldTouchData.x : 0;
                event.movementY = oldTouchData ? event.touches[0].pageY - oldTouchData.y : 0;

                if (this.lockedToDrag || Math.abs(event.movementX) + Math.abs(event.movementY) > 5) {
                    this.lockedToDrag = true;
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
                this.lockedToDrag = false;
            }, { "once": true });
        });


        window.addEventListener("wheel", (event) => {
            if (!this.cameraControls) return;
            this.setTilesize(Math.max(this.tilesize + Math.sign(event.deltaY) * -5, 14));
        });

        window.addEventListener("touchstart", (event) => {
            if (!this.cameraControls) return;
            this.lockedToDrag = true;
            if (event.touches.length === 2) {
                this.pinchZoom = 2;
                const originalTilesize = this.tilesize;
                const originalPinch = Math.hypot(
                    event.touches[0].pageX - event.touches[1].pageX,
                    event.touches[0].pageY - event.touches[1].pageY) / 4;
                const pinch = (event) => {
                    const newPinch = Math.hypot(
                        event.touches[0].pageX - event.touches[1].pageX,
                        event.touches[0].pageY - event.touches[1].pageY) / 4;
                    this.setTilesize(originalTilesize + (newPinch - originalPinch));
                };
                window.addEventListener("touchmove", pinch);

                const endListener = () => {
                    window.removeEventListener("touchmove", pinch);
                    this.lockedToDrag = false;
                    this.pinchZoom--;
                    if (this.pinchZoom === 0) window.removeEventListener("touchend", endListener)
                };
                window.addEventListener("touchend", endListener);
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