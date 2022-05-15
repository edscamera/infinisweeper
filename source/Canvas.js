class Canvas {
    constructor(name) {
        this.name = name;

        this.canvas = document.getElementById(name);
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.ctx = this.canvas.getContext("2d");

        window.addEventListener("resize", () => this.resizeCanvas(), false)
    }
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}

export default Canvas;