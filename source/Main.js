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
    const camera = new Camera(true);

    canvas.draw = (g) => {
        board.draw(g, camera);
    }
    canvas.update = () => { };
}

// Load the game
window.addEventListener("load", main, false);