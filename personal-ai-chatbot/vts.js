const fs = require("fs");
const { ApiClient } = require("vtubestudio");
const WebSocket = require("ws");

const TOKEN_FILE = "./vts-auth-token.txt";

function getAuthToken() {
    try {
        return fs.readFileSync(TOKEN_FILE, "utf8").trim();
    } catch {
        return undefined;
    }
}

function setAuthToken(token) {
    fs.writeFileSync(TOKEN_FILE, token, "utf8");
}

const vts = new ApiClient({
    pluginName: "Lucy AI",
    pluginDeveloper: "Personal AI Project",
    authTokenGetter: getAuthToken,
    authTokenSetter: setAuthToken,
    webSocketFactory: (url) => new WebSocket(url)
});

vts.on("connect", async () => {
    console.log("================================");
    console.log("✅ LUCY TERHUBUNG KE VTS!");
    console.log("================================");

    try {
        const model = await vts.currentModel();

        console.log("Model:", model.modelName);
        console.log("Model ID:", model.modelID);
    } catch (error) {
        console.error("❌ Gagal mengambil model:");
        console.error(error);
    }
});