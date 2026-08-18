export class BaseAIProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generates a chat completion
   * @param {Object} options
   * @param {string} options.systemPrompt
   * @param {Array<{role: string, content: string}>} options.messages
   * @param {string} options.model
   * @returns {Promise<string>}
   */
  async generateCompletion({ systemPrompt, messages, model }) {
    throw new Error("generateCompletion method must be implemented by subclass");
  }

  isAvailable() {
    return true;
  }
}
