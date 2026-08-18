import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.js";
import { ensureDataDirectories } from "../config/paths.js";

export const loadJsonFile = (filePath, defaultValue = null) => {
  try {
    ensureDataDirectories();
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    logger.warn(`Failed to read JSON from ${filePath}: ${error.message}`);
    return defaultValue;
  }
};

export const saveJsonFile = (filePath, data) => {
  try {
    ensureDataDirectories();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (error) {
    logger.error(`Failed to save JSON to ${filePath}: ${error.message}`);
    return false;
  }
};

export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}: ${error.message}`);
    return false;
  }
};
