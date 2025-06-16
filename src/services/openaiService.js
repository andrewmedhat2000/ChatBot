const OpenAI = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
      baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
      defaultQuery: { 'api-version': '2024-02-15' },
      defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
    });
  }

  async createChatCompletion(prompt, options = {}, lastResponseId = null) {
    try {
      const defaultOptions = {
        model: "gpt-3.5-turbo",
        instructions: options.instructions || "You are a helpful assistant.",
        input: prompt,
        temperature: 0.7,
      };

      const response = await this.client.responses.create({
        ...defaultOptions,
        ...options,
        last_response_id: lastResponseId
      });

      return {
        success: true,
        data: response.output_text,
        model: response.model,
        usage: response.usage,
        created: response.created,
        system_fingerprint: response.system_fingerprint
      };
    } catch (error) {
      logger.error('Error in OpenAI service:', error);
      
      if (error.code === 'insufficient_quota') {
        return {
          success: false,
          error: "You've exceeded your API quota. Please check your billing details or upgrade your plan.",
          type: 'insufficient_quota',
          code: error.code,
          details: "Visit https://platform.openai.com/account/billing to manage your quota"
        };
      }

      return {
        success: false,
        error: error.message,
        type: error.type || 'unknown',
        code: error.code || 'unknown'
      };
    }
  }

}

module.exports = new OpenAIService(); 