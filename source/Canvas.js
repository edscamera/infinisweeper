class Canvas {
    constructor(name) {
        this.name = name;

        this.canvas = document.getElementById(name);

        /** @type {CanvasRenderingContext2D} */
        this.CTX = this.canvas.getContext("2d");

        window.addEventListener("resize", () => this.resizeCanvas(), false);

        this.draw = (g) => { };
        this.update = () => { };

        window.setInterval(() => {
            this.CTX.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.update();
            this.draw(this.CTX);
        }, 1000 / 60);
        this.resizeCanvas();
    }
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.CTX.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw(this.CTX);
    }
}

export default Canvas;