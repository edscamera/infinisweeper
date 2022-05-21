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

    const GUI = new GUIManager("title");
    const canvas = new Canvas("infinisweeper");
    let camera = new Camera(false);
    let board = new Board((Math.random() - 0.5) * 2500, camera, false);

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
    camera.initializeControls(canvas.canvas);
    board.initializeControls(canvas.canvas);

    canvas.draw = (g) => {
        board.draw(g);
        PoppedTile.drawAllPoppedTiles(g);
    }
    canvas.update = () => {
        camera.updateTilesize();
        PoppedTile.updateAllPoppedTiles();
        if (GUI.state === "title") {
            camera.position.x += -0.01;
            camera.position.y += -0.01;
        }
    };

    const $ = (selector) => document.querySelector(selector);
    const getScoreText = () => `I got a new score of ${(board.score).toString().split("").map((j) => {
        switch (parseFloat(j)) {
            case 0: return "0️⃣";
            case 1: return "1️⃣";
            case 2: return "2️⃣";
            case 3: return "3️⃣";
            case 4: return "4️⃣";
            case 5: return "5️⃣";
            case 6: return "6️⃣";
            case 7: return "7️⃣";
            case 8: return "8️⃣";
            case 9: return "9️⃣";
        }
    }).join("")} in Infinisweeper${board.mode === "normal" ? "" : " " + board.mode.toUpperCase() + " MODE"}! 🚩\n\nhttps://edwardscamera.com/infinisweeper`;
    $("#share_copy").addEventListener("click", () => {
        if (navigator.clipboard) navigator.clipboard.writeText(getScoreText());
    });
    $("#share_twitter").addEventListener("click", () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURI(getScoreText())}`, "_blank");
    });
    $("#share_facebook").addEventListener("click", () => {
        window.open(`http://www.facebook.com/sharer.php?s=100&p[title]=${encodeURI(getScoreText())}&p[url]=https://edwardscamera.com/infinisweeper`);
    });
    $("#playAgain").addEventListener("click", () => {
        camera = new Camera(false);
        board = new Board((Math.random() - 0.5) * 2500, camera, true);
        camera.initializeControls(canvas.canvas);
        board.initializeControls(canvas.canvas);
    });
    $("#mainMenu").addEventListener("click", () => {
        GUI.set("title");
        camera = new Camera(false);
        board = new Board((Math.random() - 0.5) * 2500, camera, false);
    });
}

// Load the game
window.addEventListener("load", main, false);