import { Image } from "./Util.js";

class PoppedTile {
    static tiles = [];
    constructor(camera, position, type) {
        this.camera = camera;
        this.type = type;
        this.position = position;
        this.rotation = 0;
        this.rotationVel = 0;
        this.velocity = {
            x: (Math.random() - 0.5) * 10 / this.camera.tilesize,
            y: -Math.random() * 10 / this.camera.tilesize,
        };
        this.size = camera.tilesize;
        PoppedTile.tiles.push(this);
    }
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.y += 0.2 / this.camera.tilesize;
        this.rotation += this.rotationVel;
        if (Math.abs(this.rotationVel) < 0.1)
            this.rotationVel += 0.005 * Math.sign(this.velocity.x);
    }
    draw(g) {
        g.save();
        g.translate(
            (this.position.x - this.camera.position.x) * this.camera.tilesize + this.size / 2,
            (this.position.y - this.camera.position.y) * this.camera.tilesize + this.size / 2
        );
        g.rotate(this.rotation);
        g.fillStyle = this.type % 2 === 0 ? "#AAD650" : "#A2D048";
        if ([0, 1].includes(this.type)) g.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        if (this.type === 2) g.drawImage(Image.get("flag"), -this.size / 2, -this.size / 2, this.size, this.size);
        g.restore();
        this.size *= 0.99;
        if (this.size <= 1)
            PoppedTile.tiles.splice(PoppedTile.tiles.indexOf(this), 1);
    }
    static updateAllPoppedTiles() {
        this.tiles.forEach(t => t.update());
    }
    static drawAllPoppedTiles(g) {
        this.tiles.forEach(t => t.draw(g));
    }
}

export default PoppedTile;