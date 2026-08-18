import fs from "fs";

export const loadJsonFile = (filePath, defaultValue) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

export const saveJsonFile = (filePath, data) => {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, filePath);
};
