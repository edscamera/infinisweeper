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
    }
}

export default GUIManager;