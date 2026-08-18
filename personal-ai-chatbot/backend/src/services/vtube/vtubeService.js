import WebSocket from "ws";
import fs from "fs";
import { VTS_TOKEN_FILE } from "../../config/paths.js";
import { config } from "../../config/env.js";
import { EMOTION_EXPRESSIONS } from "../../config/constants.js";
import { logger } from "../../utils/logger.js";

class VTubeService {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.authenticated = false;
    this.authToken = this.loadStoredToken();
    this.currentExpression = "";
    this.resetTimer = null;
    this.availableExpressions = [];
    this.reconnectTimer = null;
  }

  loadStoredToken() {
    try {
      if (fs.existsSync(VTS_TOKEN_FILE)) {
        return fs.readFileSync(VTS_TOKEN_FILE, "utf8").trim();
      }
    } catch (err) {
      logger.warn(`Could not read VTS token: ${err.message}`);
    }
    return "";
  }

  saveStoredToken(token) {
    try {
      fs.writeFileSync(VTS_TOKEN_FILE, token, "utf8");
      this.authToken = token;
    } catch (err) {
      logger.warn(`Could not save VTS token: ${err.message}`);
    }
  }

  connect() {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(config.vtubeWsUrl);

      this.ws.on("open", () => {
        this.connected = true;
        logger.info(`VTube Studio connected on ${config.vtubeWsUrl}`);

        if (this.authToken) {
          this.authenticateWithToken(this.authToken);
        } else {
          this.requestAuthToken();
        }
      });

      this.ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (err) {
          logger.error(`VTube message parse error: ${err.message}`);
        }
      });

      this.ws.on("error", (error) => {
        this.connected = false;
        this.authenticated = false;
        logger.debug(`VTube Studio WebSocket offline: ${error.message}`);
      });

      this.ws.on("close", () => {
        this.connected = false;
        this.authenticated = false;
        this.ws = null;
        logger.debug("VTube Studio connection closed");
      });
    } catch (error) {
      this.connected = false;
      this.authenticated = false;
    }
  }

  sendRequest(messageType, data = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    const payload = {
      apiName: "VTubeStudioPublicAPI",
      apiVersion: "1.0",
      requestID: `lucy_${Date.now()}`,
      messageType,
      data,
    };
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  requestAuthToken() {
    this.sendRequest("AuthenticationTokenRequest", {
      pluginName: config.vtubePluginName,
      pluginDeveloper: config.vtubePluginDeveloper,
    });
  }

  authenticateWithToken(token) {
    this.sendRequest("AuthenticationRequest", {
      pluginName: config.vtubePluginName,
      pluginDeveloper: config.vtubePluginDeveloper,
      authenticationToken: token,
    });
  }

  handleMessage(message) {
    if (message.messageType === "AuthenticationTokenResponse") {
      const token = message.data?.authenticationToken;
      if (token) {
        this.saveStoredToken(token);
        this.authenticateWithToken(token);
      }
      return;
    }

    if (message.messageType === "AuthenticationResponse") {
      if (message.data?.authenticated) {
        this.authenticated = true;
        logger.info("VTube Studio authentication successful!");
        this.sendRequest("ExpressionStateRequest");
      } else {
        this.authenticated = false;
        logger.warn("VTube Studio plugin not yet allowed in VTS settings.");
      }
      return;
    }

    if (message.messageType === "ExpressionStateResponse") {
      this.availableExpressions = message.data?.expressions || [];
      logger.info(`VTube expressions loaded: ${this.availableExpressions.length} expressions available.`);
      return;
    }
  }

  setExpression(emotionOrFileName) {
    if (!this.connected) {
      this.connect();
      return false;
    }
    if (!this.authenticated) {
      return false;
    }

    const expressionFile = EMOTION_EXPRESSIONS[emotionOrFileName] || emotionOrFileName;
    if (!expressionFile) {
      return false;
    }

    if (this.currentExpression && this.currentExpression !== expressionFile) {
      this.sendRequest("ExpressionActivationRequest", {
        expressionFile: this.currentExpression,
        active: false,
      });
    }

    this.sendRequest("ExpressionActivationRequest", {
      expressionFile,
      active: true,
    });
    this.currentExpression = expressionFile;

    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      if (this.currentExpression) {
        this.sendRequest("ExpressionActivationRequest", {
          expressionFile: this.currentExpression,
          active: false,
        });
        this.currentExpression = "";
      }
    }, 5000);

    return true;
  }

  getStatus() {
    return {
      connected: this.connected,
      authenticated: this.authenticated,
      currentExpression: this.currentExpression,
      availableExpressionsCount: this.availableExpressions.length,
    };
  }

  initialize() {
    this.connect();
  }
}

export const vtubeService = new VTubeService();
