import app from "./src/app.js";
import { startServer } from "./src/server.js";
import { classifyMemoryCandidate } from "./src/services/memory/memoryClassifier.js";
import { buildFallbackReply } from "./src/services/ai/fallbackResponder.js";

// Check if running directly
const isMain = process.argv[1] && (
  process.argv[1].endsWith("server.js") ||
  process.argv[1].endsWith("server.js")
);

if (isMain) {
  startServer();
}

export { app, startServer, classifyMemoryCandidate, buildFallbackReply };
export default app;