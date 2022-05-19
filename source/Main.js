import Board from "./Board.js";
import Camera from "./Camera.js";
import Canvas from "./Canvas.js";
import GUIManager from "./GUIManager.js";
import { Input, Image } from "./Util.js"

/**
 * The main function
 * @returns {Void}
 */
function main() {
    const GUI = new GUIManager("game");
    const canvas = new Canvas("infinisweeper");
    const camera = new Camera(true);
    const board = new Board((Math.random() - 0.5) * 2500, camera, true);

    Image.add("flag", "../images/flag.png");
    Image.add("flag_animation", "../images/flag_animation.png");

    Input.initialize();

    canvas.draw = (g) => {
        board.draw(g);
        
        if (board.score === 0) {
            if (!board.initialTile) board.findInitialTile();
            board.snapToInitialTile();
        }
    }
    canvas.update = () => { };
}

// Load the game
window.addEventListener("load", main, false);