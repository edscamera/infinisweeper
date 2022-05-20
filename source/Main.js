import Board from "./Board.js";
import Camera from "./Camera.js";
import Canvas from "./Canvas.js";
import GUIManager from "./GUIManager.js";
import PoppedTile from "./PoppedTile.js";
import { SoundEffect, Input, Image } from "./Util.js"

/**
 * The main function
 * @returns {Void}
 */
function main() {
    if (localStorage["edwardscamera.infinisweeper.highScore.normal"]) {
        localStorage.highScore_normal = localStorage["edwardscamera.infinisweeper.highScore.normal"];
        localStorage.removeItem("edwardscamera.infinisweeper.highScore.normal");
    }
    if (localStorage["edwardscamera.infinisweeper.highScore.normal"]) {
        localStorage.highScore_rush = localStorage["edwardscamera.infinisweeper.highScore.rush"];
        localStorage.removeItem("edwardscamera.infinisweeper.highScore.rush");
    }
    if (localStorage["edwardscamera.infinisweeper.saveData"]) {
        localStorage.saved_data = localStorage["edwardscamera.infinisweeper.saveData"];
        localStorage.removeItem("edwardscamera.infinisweeper.saveData");
    }

    const GUI = new GUIManager("game");
    const canvas = new Canvas("infinisweeper");
    const camera = new Camera(false);
    const board = new Board((Math.random() - 0.5) * 2500, camera, true);
    window.a = camera;
    window.b = board;

    Image.add("flag", "../images/flag.png");
    Image.add("flag_animation", "../images/flag_animation.png");
    SoundEffect.add("blip_1", "../audio/blip_1.mp3");
    SoundEffect.add("blip_2", "../audio/blip_2.mp3");
    SoundEffect.add("blip_3", "../audio/blip_3.mp3");
    SoundEffect.add("blip_4", "../audio/blip_4.mp3");
    SoundEffect.add("blip_5", "../audio/blip_5.mp3");
    SoundEffect.add("blip_6", "../audio/blip_6.mp3");
    SoundEffect.add("blip_7", "../audio/blip_7.mp3");
    SoundEffect.add("blip_8", "../audio/blip_8.mp3");
    SoundEffect.add("confetti", "../audio/confetti.mp3");
    SoundEffect.add("flag_down", "../audio/flag_down.mp3");
    SoundEffect.add("flag_up", "../audio/flag_up.mp3");
    SoundEffect.add("reveal", "../audio/reveal.mp3");

    Input.initialize();
    board.initializeControls(canvas.canvas);
    camera.initializeControls(canvas.canvas);

    canvas.draw = (g) => {
        board.draw(g);

        PoppedTile.drawAllPoppedTiles(g);
    }
    canvas.update = () => {
        camera.updateTilesize();
        PoppedTile.updateAllPoppedTiles();
    };
}

// Load the game
window.addEventListener("load", main, false);