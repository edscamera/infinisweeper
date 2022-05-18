class Input {
    static mouse = {
        position: {
            "x": 0,
            "y": 0,
        }
    };
    static initialize() {
        window.addEventListener("mousemove", (evt) => {
            this.mouse.position = {
                "x": evt.pageX,
                "y": evt.pageY,
            }
        });
    }
}

export default Input;