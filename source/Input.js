class Input {
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

export default Input;