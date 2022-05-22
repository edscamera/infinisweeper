class Settings {
    static defaultSettings = {
        "animateFallingTiles": true,
        "animateTileReveal": true,
        "animateTileReveal_t": 1,
        "animateFlags": true,

        "drawBorders": true,
        "dragSensitivity": 2,

        "muted": false,
        "autoSave": true,
        "autoSave_t": .25,
    }
    static dictionary = {
        "animateFallingTiles": {
            "display": "Animate Falling Tiles",
            "type": "checkbox",
        },
        "animateTileReveal": {
            "display": "Animate Tile Reveal",
            "type": "checkbox",
        },
        "animateTileReveal_t": {
            "display": "Animate Tile Reveal Time",
            "type": "number",
        },
        "animateFlags": {
            "display": "Animate Flags",
            "type": "checkbox",
        },
        "drawBorders": {
            "display": "Draw Borders",
            "type": "checkbox",
        },
        "dragSensitivity": {
            "display": "Camera Move Sensitivity",
            "type": "number",
        },
        "muted": {
            "display": "Mute Sound Effects",
            "type": "checkbox",
        },
        "autoSave": {
            "display": "Auto Save",
            "type": "checkbox",
        },
        "autoSave_t": {
            "display": "Auto Save Interval (minutes)",
            "type": "number",
        }
    }
    static settings = Settings.defaultSettings;
    static initialize() {
        if (!localStorage.settings) localStorage.settings = JSON.stringify(Settings.defaultSettings);
        Settings.settings = Object.assign(Settings.settings, JSON.parse(localStorage.settings));
        Settings.updateSettings();
    }
    static updateSettings() {
        const $ = (selector) => document.querySelector(selector);
        Settings.settings = JSON.parse(localStorage.settings);
        $("#settingsSubcontainer").innerHTML = "";
        Object.keys(Settings.settings).forEach(key => {
            const div = document.createElement("div");
            div.classList.add("settings_entry");
            div.innerHTML = `
                <span class="settings_label">${Settings.dictionary[key].display}</span>
                <input type="${Settings.dictionary[key].type}" class="settings_input" />
            `;
            div.setAttribute("settingsID", key);
            div.querySelector("input")[Settings.dictionary[key].type === "checkbox" ? "checked" : "value"] = Settings.settings[key];
            $("#settingsSubcontainer").appendChild(div);
        });
    }
    static menu() {
        Settings.settings = JSON.parse(localStorage.settings);
    }
    static save() {
        Settings.settings = JSON.parse(localStorage.settings);
        const $ = (selector) => document.querySelector(selector);
        Array.from($("#settingsSubcontainer").children).forEach(elm => {
            Settings.settings[elm.getAttribute("settingsID")] = elm.children[1].value;
            if (Settings.dictionary[elm.getAttribute("settingsID")].type === "checkbox") {
                Settings.settings[elm.getAttribute("settingsID")] = elm.children[1].checked;
            }
        });
        localStorage.settings = JSON.stringify(Settings.settings);
    }
}

export default Settings;