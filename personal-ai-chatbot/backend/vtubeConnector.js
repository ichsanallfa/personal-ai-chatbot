import { vtubeService } from "./src/services/vtube/vtubeService.js";

export const setAvatarExpression = (emotion) => vtubeService.setExpression(emotion);
export const initializeAvatar = () => vtubeService.initialize();
export const connectVTube = () => vtubeService.connect();
export const getVTubeStatus = () => vtubeService.getStatus();