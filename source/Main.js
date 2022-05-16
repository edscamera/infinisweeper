import Board from "./Board.js";
import Camera from "./Camera.js";
import Canvas from "./Canvas.js";
import GUIManager from "./GUIManager.js";

/**
 * The main function
 * @returns {Void}
 */
function main() {
    const GUI = new GUIManager("game");
    const canvas = new Canvas("infinisweeper");
    const board = new Board((Math.random() - 0.5) * 2500);
    const camera = new Camera();

    console.log(board);

    canvas.draw = (g) => {
        g.fillStyle = "#000";
        for (let x = Math.floor(camera.position.x); x <= camera.position.x + canvas.width / camera.tilesize; x++) {
            for (let y = Math.floor(camera.position.y); y <= camera.position.y + canvas.height / camera.tilesize; y++) {
                const tile = board.get(x, y);
                if (tile.value === -1) {
                    g.fillRect(
                        Math.round((x - camera.position.x) * camera.tilesize),
                        Math.round((y - camera.position.y) * camera.tilesize),
                        camera.tilesize, camera.tilesize
                    );
                } else {
                    g.fillText(tile.value, (x - camera.position.x) * camera.tilesize, (y - camera.position.y) * camera.tilesize + 24);
                }
            }
        }

        camera.position.x -= 0.01;
        camera.position.y -= 0.01;
    };
    canvas.update = () => {

    };
}

// Load the game
window.addEventListener("load", main, false);