window.addEventListener("load", () => {
    // Load all images in dictionary
    if (typeof (img) === "object") Object.keys(img).forEach(key => img[key] = Object.assign(document.createElement("img"), { src: img[key] }));
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
    static initialize() {
        window.addEventListener("mousemove", evt => {
            this.mouse.position.x = evt.clientX;
            this.mouse.position.y = evt.clientY;
            this.mouse.relativePosition.x = evt.clientX / CANVAS.width;
            this.mouse.relativePosition.y = evt.clientY / CANVAS.height;
        });
        window.addEventListener("mousedown", evt => this.mouse.buttons[evt.button] = true);
        window.addEventListener("mouseup", evt => this.mouse.buttons[evt.button] = false);
        window.addEventListener("keydown", evt => this.keyDown[evt.key] = true);
        window.addEventListener("keyup", evt => this.keyDown[evt.key] = false);
    }
}