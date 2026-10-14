import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem("lucy_auth_token");
  if (token) {
    reqConfig.headers["Authorization"] = `Bearer ${token}`;
  } else {
    const storedUserId = localStorage.getItem("lucy_user_id") || "web_user";
    reqConfig.headers["x-user-id"] = storedUserId;
  }
  return reqConfig;
});

export const authApi = {
  initSession: async (userId) => {
    const res = await apiClient.post("/api/auth/session", { userId });
    return res.data;
  },
  loginOwner: async (secretKey) => {
    const res = await apiClient.post("/api/auth/login/owner", { secretKey });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get("/api/auth/me");
    return res.data;
  },
  linkPlatform: async (platform, platformUserId) => {
    const res = await apiClient.post("/api/auth/link", { platform, platformUserId });
    return res.data;
  },
};

export const chatApi = {
  sendMessage: async (message) => {
    const res = await apiClient.post("/api/chat", { message });
    return res.data;
  },
  getHistory: async () => {
    const res = await apiClient.get("/api/chat/history");
    return res.data;
  },
  clearHistory: async () => {
    const res = await apiClient.delete("/api/chat/history");
    return res.data;
  },
};

export const reminderApi = {
  getReminders: async () => {
    const res = await apiClient.get("/api/reminders");
    return res.data;
  },
  createReminder: async (data) => {
    const res = await apiClient.post("/api/reminders", data);
    return res.data;
  },
  deleteReminder: async (id) => {
    const res = await apiClient.delete(`/api/reminders/${id}`);
    return res.data;
  },
  clearAll: async () => {
    const res = await apiClient.delete("/api/reminders/all");
    return res.data;
  },
  getNotifications: async () => {
    const res = await apiClient.get("/api/reminders/notifications");
    return res.data;
  },
};

export const memoryApi = {
  getUserMemory: async () => {
    const res = await apiClient.get("/api/memory/user");
    return res.data;
  },
  deleteUserMemory: async (id) => {
    const res = await apiClient.delete(`/api/memory/user/${id}`);
    return res.data;
  },
  getCoreMemory: async () => {
    const res = await apiClient.get("/api/memory/core");
    return res.data;
  },
  getTemporaryMemory: async () => {
    const res = await apiClient.get("/api/memory/temporary");
    return res.data;
  },
};

export const vtubeApi = {
  getStatus: async () => {
    const res = await apiClient.get("/api/vtube/status");
    return res.data;
  },
  triggerExpression: async (expression) => {
    const res = await apiClient.post("/api/vtube/expression", { expression });
    return res.data;
  },
  reconnect: async () => {
    const res = await apiClient.post("/api/vtube/reconnect");
    return res.data;
  },
};

export const ttsApi = {
  getAudioUrl: (text, voice = "id-ID-GadisNeural", pitch = "+25Hz", rate = "+8%") => {
    const params = new URLSearchParams({ text, voice, pitch, rate });
    return `${API_BASE}/api/tts?${params.toString()}`;
  },
};
