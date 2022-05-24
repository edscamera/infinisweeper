import Board from "./Board.js";
import Camera from "./Camera.js";
import Canvas from "./Canvas.js";
import GUIManager from "./GUIManager.js";
import PoppedTile from "./PoppedTile.js";
import Settings from "./Settings.js";
import { SoundEffect, Input, Image, prng, Particle } from "./Util.js"

/**
 * The main function
 * @returns {Void}
 */
function main() {
    const $ = (selector) => document.querySelector(selector);

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        window.deferredPrompt = event;
        $("#installBtn").setAttribute("hide", false);
    });
    $("#installBtn").addEventListener("click", async () => {
        const promptEvent = window.deferredPrompt;
        if (!promptEvent) return;
        promptEvent.prompt();
        const result = await promptEvent.userChoice;
        window.deferredPrompt = null;
        $("#installBtn").setAttribute("hide", true);
    });

    if ('serviceWorker' in navigator) navigator.serviceWorker.register("./sw.js");

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
    Image.add("incorrect_flag", "../images/incorrect_flag.png");
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
        Particle.drawAllParticles(g);
    }
    canvas.update = () => {
        camera.updateTilesize();
        PoppedTile.updateAllPoppedTiles();
        Particle.updateAllParticles();
        if (["title", "settings", "highScores"].includes(GUI.state)) {
            camera.position.x += -0.01;
            camera.position.y += -0.01;
        }
    };

    $("#versionText").innerText = `${$("#innerChangelog").querySelector("span").innerText} | `
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
    $("#saveGame").addEventListener("click", () => {
        if ($("#saveGame").disabled) return;
        $("#saveGame").disabled = true;
        $("#saveGame").innerText = "Saving 0%";
        board.saveGame((d) => {
            $("#saveGame").innerText = `Saving ${Math.round(d * 100)}%`;
        }, (e) => {
            $("#saveGame").innerText = e ? "Saved!" : "Could Not Save";
            window.setTimeout(() => {
                $("#saveGame").disabled = false;
                $("#saveGame").innerText = "Save Game";
            }, 1000);
        });
    });
    $("#mainMenuGame").addEventListener("click", () => window.location.reload());

    window.prng = prng;
    const newGame = (mode) => {
        GUI.set("game");
        camera = new Camera(false);
        if (board) board.spreadParticles = false;
        board = new Board((Math.random() - 0.5) * 2500, camera, true);
        board.mode = mode;
        if (!localStorage[`highScore_${board.mode}`]) localStorage[`highScore_${board.mode}`] = 0;
        camera.initializeControls(canvas.canvas);
        board.initializeControls(canvas.canvas);
    };
    const mainMenu = () => {
        GUI.set("title");
        camera = new Camera(false);
        board = new Board((Math.random() - 0.5) * 2500, camera, false);
    };

    $("#playAgain").addEventListener("click", () => newGame(board.mode));
    $("#mainMenu").addEventListener("click", mainMenu);

    $("#newGame").addEventListener("click", () => newGame("normal"));
    $("#continueGame").addEventListener("click", () => {
        GUI.set("loading");
        let data = localStorage.saved_data.split(",");

        camera = new Camera(true);
        board = new Board(parseFloat(data.shift()), camera, true);

        camera.position = {
            "x": parseFloat(data.shift()),
            "y": parseFloat(data.shift()),
        };
        camera.setTilesize(parseFloat(data.shift()));
        board.secondsPlayed = parseFloat(data.shift());

        let index = 0;
        $("#loadingDisplay").innerText = "Loading 0%";
        const loadInterval = window.setInterval(() => {
            for (let _ = 0; _ < 100; _++) {
                board.generate(parseFloat(data[index * 3]), parseFloat(data[index * 3 + 1]));
                board.set(parseFloat(data[index * 3]), parseFloat(data[index * 3 + 1]), {
                    "flagState": parseFloat(data[index * 3 + 2]) == 2 ? 1 : 0,
                    "covered": parseFloat(data[index * 3 + 2]) != 0,
                });
                board.score += parseFloat(data[index * 3 + 2]) != 0 ? 0 : 1;
                board.flags += parseFloat(data[index * 3 + 2]) == 2 ? 1 : 0;
                index++;
                $("#loadingDisplay").innerText = `Loading ${Math.round(index / (data.length / 3) * 100)}%`
                if (index > data.length / 3) {
                    camera.initializeControls(canvas.canvas);
                    board.initializeControls(canvas.canvas);

                    GUI.set("game");

                    window.clearInterval(loadInterval);
                    break;
                }
            }
        });
    });
    $("#newGameRush").addEventListener("click", () => newGame("rush"));
    $("#highScoresMenu").addEventListener("click", () => {
        GUI.set("highScores");
    });
    $("#highScoresBack").addEventListener("click", () => mainMenu());
    const getScores = () => {
        if (typeof window.db === "object") {
            ["Normal", "Rush"].forEach(mode => {
                const mode2 = mode.toLowerCase();
                $(`#${mode2}ScoreTable`).querySelector("tbody").innerHTML = "";
                db.ref(`/scores/${mode2}/`).once('value').then(snapshot => {
                    const table = Object.values(snapshot.val()).sort((a, b) => b.score - a.score).slice(0, 10);
                    $(`#${mode2}ScoreTable`).querySelector("tbody").innerHTML += `<th>${mode} Mode</th>`
                    table.forEach(index => {
                        $(`#${mode2}ScoreTable`).querySelector("tbody").innerHTML += `<tr><td id="_${mode2}_${index.uid}">Loading</td><td>${index.score}</td></tr>`;
                        db.ref(`/names/${index.uid}/`).once('value').then(data => {
                            $(`#_${mode2}_${index.uid}`).innerText = data.val();
                        });
                    });
                });
            });
        } else {
            ["Normal", "Rush"].forEach(mode => {
                const mode2 = mode.toLowerCase();
                $(`#${mode2}ScoreTable`).querySelector("tbody").innerHTML = "Could Not Connect";
            });
        }
    };
    $("#refreshScores").addEventListener("click", getScores);
    getScores();
    $("#settingsMenu").addEventListener("click", () => {
        Settings.settings = JSON.parse(localStorage.settings);
        Settings.updateSettings();
        GUI.set("settings");
    });

    $("#settingsMainMenu").addEventListener("click", () => {
        Settings.menu();
        mainMenu();
    });
    $("#settingsSave").addEventListener("click", () => {
        Settings.save();
        mainMenu();
    });
    Settings.initialize();

    const onAuthStateChanged = () => {
        $("#accountName").innerText = "Connecting...";
        if (typeof window.firebase === "object" && typeof window.db === "object") {
            if (firebase.auth().currentUser != null) {
                $("#signin").setAttribute("hide", true);
                $("#signout").setAttribute("hide", false);
                db.ref(`/names/${firebase.auth().getUid()}`).once('value').then(snapshot => {
                    if (!snapshot.val() || snapshot.val() == null) {
                        GUI.set("nameChange");
                        const input = document.querySelector("#inputname")
                        const submit = document.querySelector("#submitName");
                        submit.disabled = true;
                        input.oninput = () => {
                            const val = input.value.replace(/\s/g, "");
                            submit.disabled = val.length < 4 || val.length > 24;
                        };
                        submit.onclick = () => {
                            const val = input.value.replace(/\s/g, "");
                            if (val.length < 4 || val.length > 24) return;
                            $("#accountName").innerText = `Logged in: ${val}`;
                            db.ref(`/names/${firebase.auth().getUid()}`).set(val);
                            GUI.set("title");
                        };
                    } else {
                        $("#accountName").innerText = `Logged in: ${snapshot.val()}`;
                    }
                });
            } else {
                $("#signin").setAttribute("hide", false);
                $("#signout").setAttribute("hide", true);
                $("#accountName").innerText = "Signed Out";
            }
        } else {
            $("#accountName").innerText = "Could Not Connect";
        }
    }

    firebase.auth().onAuthStateChanged(onAuthStateChanged);
    $("#signin").addEventListener("click", () => {
        if (firebase.auth().currentUser) return;
    
        const provider = new firebase.auth.GoogleAuthProvider();
    
        firebase.auth().signInWithPopup(provider).then((result) => {
            onAuthStateChanged();
        }).catch((error) => {
            $("#signin").innerText = error;
            $("#signin").addEventListener("mouseout", () => {
                $("#signin").innerText = "Sign In";
            }, { "once": true, });
            console.error(error);
        });
    });
    $("#signout").addEventListener("click", () => {
        if (!firebase.auth().currentUser) return;
        firebase.auth().signOut();
    });
}

// Load the game
window.addEventListener("load", main, false);