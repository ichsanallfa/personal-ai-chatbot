import fs from "fs";
import { logger } from "../utils/logger.js";
import { ensureDataDirectories } from "../config/paths.js";
import { readDocument, writeDocument } from "./sqliteStorage.js";

const writeQueues = new Map();

export const loadJsonFile = (filePath, defaultValue = null) => {
  const stored = readDocument(filePath, undefined);
  if (stored !== undefined) return stored;
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
    writeDocument(filePath, data);
    return true;
  } catch (error) {
    logger.error(`Failed to save JSON to ${filePath}: ${error.message}`);
    return false;
  }
};

export const saveJsonFileQueued = async (filePath, data) => {
  writeDocument(filePath, data);
  return true;
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
