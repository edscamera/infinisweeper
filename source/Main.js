import Canvas from "./Canvas.js";
import GUIManager from "./GUIManager.js";

// Main Function
function main() {
    const GUI = new GUIManager("game");
    const canvas = new Canvas("infinisweeper");
}

// Load the game
window.addEventListener("load", main, false);