import { memoryService } from "../services/memory/memoryService.js";

export const getCoreMemory = async (req, res, next) => {
  try {
    const core = memoryService.getCoreMemory();
    res.json({
      success: true,
      data: core,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCoreMemory = async (req, res, next) => {
  try {
    const updated = memoryService.updateCoreMemory(req.body);
    res.json({
      success: true,
      data: updated,
      message: "Core memory updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserMemory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const memory = memoryService.getUserMemory(userId);
    res.json({
      success: true,
      data: memory,
    });
  } catch (error) {
    next(error);
  }
};

export const addUserMemoryItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { content, category, importance } = req.body;
    const item = memoryService.addUserMemoryItem(userId, content, category, importance);
    res.json({
      success: true,
      data: item,
      message: item ? "Memory item saved" : "Item already exists or too short",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserMemoryItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { memoryId } = req.params;
    const updated = memoryService.deleteUserMemoryItem(userId, memoryId);
    res.json({
      success: true,
      data: updated,
      message: "Memory item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTemporaryMemory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const tempMemory = memoryService.getTemporaryMemory(userId);
    res.json({
      success: true,
      data: tempMemory,
    });
  } catch (error) {
    next(error);
  }
};
