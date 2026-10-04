import { Client, GatewayIntentBits, Partials } from "discord.js";
import axios from "axios";
import { config } from "../config/env.js";
import { isAllowedUser, isOwnerUser } from "../../discordAccess.js";
import { reminderService } from "../services/reminder/reminderService.js";
import { extractReminderDetails, parseReminderTime } from "../services/reminder/reminderParser.js";

let botEnabled = true;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });
const sendReply = async (message, text) => { try { await message.reply(text); return true; } catch { try { await message.channel.send(text); return true; } catch { return false; } } };
client.on("ready", () => console.log(`Discord bot logged in as ${client.user.tag}`));
client.on("messageCreate", async (message) => {
	if (message.author.bot) return;
	const userId = message.author.id;
	const content = message.content || "";
	const lower = content.toLowerCase();
	if (lower === "!on" || lower === "!off") { if (!isOwnerUser(userId)) return sendReply(message, "Maaf, hanya owner yang bisa menggunakan perintah ini."); botEnabled = lower === "!on"; return sendReply(message, botEnabled ? "Lucy enabled." : "Lucy disabled."); }
	if (lower === "!id" || lower === "!whoami") return sendReply(message, `ID Discord Anda: ${userId} (${isOwnerUser(userId) ? "Owner" : "User"})`);
	if (/bersihkan semua reminder|hapus semua reminder|clear all reminder|clear reminders/i.test(lower)) { if (!isOwnerUser(userId)) return sendReply(message, "Maaf, hanya owner yang bisa menggunakan perintah ini."); reminderService.clearAllReminders(); return sendReply(message, "Semua reminder sudah dibersihkan."); }
	if (!botEnabled || !isAllowedUser(userId, process.env, { guildOwnerId: message.guild?.ownerId })) return;
	const details = extractReminderDetails(content);
	if (details.isReminderRequest && details.needsTime) return sendReply(message, 'Contoh: "ingatkan saya jam 22:00 belajar".');
	if (details.timeText) { const scheduledAt = parseReminderTime(details.timeText); if (!scheduledAt) return sendReply(message, "Format waktu tidak dikenali."); const reminderMessage = details.reminderMessage || "Reminder dari Lucy"; reminderService.createReminder({ userId, platform: "discord", platformUserId: userId, message: reminderMessage, scheduledAt }); return sendReply(message, `Siap. Pesan: "${reminderMessage}"`); }
	try { await message.channel.sendTyping(); const response = await axios.post(config.backendUrl, { message: content }, { headers: { "x-service-key": config.serviceApiKey, "x-user-id": userId, "x-platform": "discord" } }); return sendReply(message, response.data.data?.reply || response.data.reply || "Maaf, ada kendala respon."); } catch (error) { console.error("Discord bot backend error:", error.response?.data || error.message); return sendReply(message, "Error communicating dengan Lucy AI."); }
});
export const startDiscordBot = async () => { if (!config.discordBotToken) return false; await client.login(config.discordBotToken); return true; };
export const stopDiscordBot = async () => { await client.destroy(); };
export { client };
