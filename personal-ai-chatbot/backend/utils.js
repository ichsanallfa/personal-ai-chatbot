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
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
