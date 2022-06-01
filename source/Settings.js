import { $ } from "./Util.js";

class Settings {
    static defaultSettings = {
        "animateFallingTiles": true,
        "animateTileReveal": true,
        "animateTileReveal_t": 1,
        "animateFlags": true,
        "cameraShake": true,

        "drawBorders": true,
        "drawParticles": true,
        "dragSensitivity": 2,

        "scrollToZoom": true,
        "muted": false,
        "autoSave": true,
        "autoSave_t": .25,
    }
    static dictionary = {
        "animateFallingTiles": {
            "display": "Animate Falling Tiles",
            "desc": "When enabled, tiles will pop off the board and fall. No jumpscare. Helps performance.",
            "type": "checkbox",
        },
        "animateTileReveal": {
            "display": "Animate Tile Reveal",
            "desc": "When enabled, tiles will gradually be revealed.",
            "type": "checkbox",
        },
        "animateTileReveal_t": {
            "display": "Animate Tile Reveal Time",
            "desc": "The speed at which tiles are gradually revealed.",
            "type": "number",
        },
        "animateFlags": {
            "display": "Animate Flags",
            "desc": "When disabled, flags will not be animated. Helps performance.",
            "type": "checkbox",
        },
        "cameraShake": {
            "display": "Camera Shake",
            "desc": "When enabled, the camera will shake when large amounts of tiles are revealed.",
            "type": "checkbox",
        },
        "drawBorders": {
            "display": "Draw Borders",
            "desc": "When disabled, borders will not be drawn between covered and uncovered tiles. Helps performance.",
            "type": "checkbox",
        },
        "drawParticles": {
            "display": "Draw Particles",
            "desc": "When disabled, mines will not spread particles when triggered. Helps performance.",
            "type": "checkbox",
        },
        "dragSensitivity": {
            "display": "Camera Move Sensitivity",
            "desc": "How much you should move your mouse/finger to move the camera.",
            "type": "number",
        },
        "scrollToZoom": {
            "display": "Scroll To Zoom",
            "desc": "Enables zooming using the scroll wheel.",
            "type": "checkbox",
        },
        "muted": {
            "display": "Mute Sound Effects",
            "type": "checkbox",
        },
        "autoSave": {
            "display": "Auto Save",
            "desc": "When enabled, the game will automatically be saved at an interval.",
            "type": "checkbox",
        },
        "autoSave_t": {
            "display": "Auto Save Interval (Minutes)",
            "desc": "How often the game will be automatically saved (minutes).",
            "type": "number",
        }
    }
    static settings = Settings.defaultSettings;
    static initialize() {
        if (!localStorage.settings) localStorage.settings = JSON.stringify(Settings.defaultSettings);
        Settings.settings = Object.assign(Settings.settings, JSON.parse(localStorage.settings));
        Object.keys(Settings.defaultSettings).forEach(key => {
            if (!Settings.settings.hasOwnProperty(key)) Settings.settings[key] = Settings.defaultSettings[key];
            localStorage.settings = JSON.stringify(Settings.settings);
        });
        if (!localStorage.settings) localStorage.settings = JSON.stringify(Settings.defaultSettings);
        Settings.updateSettings();
    }
    static updateSettings() {
        const $$ = (selector) => {
            if (!document.getElementsByClassName(selector)) return [];
            return Array.from(document.getElementsByClassName(selector));
        }
        $("#settingsSubcontainer").innerHTML = "";
        Object.keys(Settings.settings).forEach(key => {
            if (!["animateTileReveal_t"].includes(key)) {
                const div = document.createElement("div");
                div.classList.add("settings_entry", `_${key}`);
                div.innerHTML = `
                <span class="settings_label">${Settings.dictionary[key].display}</span><br />
                <input class="__${key}" type="${Settings.dictionary[key].type}" class="settings_input" />
                `;
                setTimeout(() => {
                    $(`.__${key}`).addEventListener("input", () => {
                        if ($$(`_${key}_t`).length > 0) $$(`_${key}_t`).forEach(elm => elm.style.display = $(`.__${key}`).checked ? "flex" : "none");
                    });
                    if ($$(`_${key}_t`).length > 0) $$(`_${key}_t`).forEach(elm => elm.style.display = $(`.__${key}`).checked ? "flex" : "none");
                }, 1);
                div.setAttribute("settingsID", key);
                div.querySelector("input")[Settings.dictionary[key].type === "checkbox" ? "checked" : "value"] = Settings.settings[key];
                $("#settingsSubcontainer").appendChild(div);
                if (Settings.dictionary[key].desc) {
                    const p = document.createElement("p");
                    p.innerText = Settings.dictionary[key].desc;
                    p.classList.add(`_${key}`);
                    $("#settingsSubcontainer").appendChild(p);
                }
            }
        });
    }
    static menu() {
        Settings.settings = JSON.parse(localStorage.settings);
    }
    static save() {
        Settings.settings = JSON.parse(localStorage.settings);
        Array.from(document.getElementsByClassName("settings_entry")).forEach(elm => {
            Settings.settings[elm.getAttribute("settingsID")] = elm.children[2].value;
            if (Settings.dictionary[elm.getAttribute("settingsID")].type === "checkbox") {
                Settings.settings[elm.getAttribute("settingsID")] = elm.children[2].checked;
            }
        });
        localStorage.settings = JSON.stringify(Settings.settings);
    }
}

export default Settings;