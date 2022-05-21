class GUIManager {
    constructor(state) {
        this.set(state);
    }
    set(state) {
        this.state = state;
        const GUIPanels = Array.from(document.getElementsByClassName("GUI"));
        GUIPanels.forEach(GUIPanel => {
            GUIPanel.style.display = "none";
            if (GUIPanel.getAttribute("GUI") === this.state)
                GUIPanel.style.display = "block";
        });
        const $ = (selector) => document.querySelector(selector);
        if (this.state === "title") {
            $("#continueGameBR").style.display = $("#continueGame").style.display = (typeof localStorage.saved_data == "string" && localStorage.saved_data.includes(",")) ? "inline-block" : "none";
        }
    }
}

export default GUIManager;