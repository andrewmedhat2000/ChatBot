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

  async createChatCompletion(prompt, options = {}, lastResponseId = null, test = false, projectName = null) {
    try {

      if (test) {
        const testMessages = [
          "This is a test response from the OpenAI service. The prompt was: " + prompt,
          "Test mode activated! You said: " + prompt,
          "Mock response for testing purposes. Original prompt: " + prompt,
          "This is a simulated AI response. Your input was: " + prompt,
          "Test response generated. You asked: " + prompt,
          "Fake AI response for development. Prompt received: " + prompt,
          "Mock completion service response. User said: " + prompt,
          "Test environment response. Input: " + prompt,
          "Simulated chat completion. Your message: " + prompt,
          "Development mode response. Original text: " + prompt
        ];
        
        const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
        
        return {
          success: true,
          message: randomMessage,
          last_response_id: "test-response-id-" + Math.random().toString(36).substr(2, 9),
          project_name: projectName
        };
      }

      const defaultOptions = {
        model: "gpt-4.1",
        instructions: options.instructions || "You are a helpful assistant.",
        input: prompt,
        temperature: 0.7,
      };

      const payload = {
        ...defaultOptions,
        ...options
      };
      
      if (lastResponseId !== null) {
        payload.previous_response_id = lastResponseId;
      }

      const response = await this.client.responses.create(payload);

      return {
        success: true,
        message: response.output_text,
        last_response_id: response.id,
        project_name: projectName
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