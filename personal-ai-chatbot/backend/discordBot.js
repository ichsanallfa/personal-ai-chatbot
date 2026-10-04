import { startDiscordBot } from "./src/bots/discordBot.js";

startDiscordBot().catch((error) => {
  console.error("Discord bot startup failed:", error.message);
});
