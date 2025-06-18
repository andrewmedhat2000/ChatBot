const openaiService = require('./openaiService');
const logger = require('../utils/logger');

jest.mock('openai');
jest.mock('../utils/logger');

describe('OpenAIService.createChatCompletion', () => {
  let originalClient;

  beforeEach(() => {
    // Store original client
    originalClient = openaiService.client;
    
    // Mock the client
    openaiService.client = {
      responses: {
        create: jest.fn()
      }
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original client
    openaiService.client = originalClient;
  });

  describe('successful responses', () => {
    it('should return success and message with last_response_id when provided', async () => {
      const mockResponse = {
        output_text: 'Hello! How can I help you today?',
        id: 'abc123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const result = await openaiService.createChatCompletion('Hi', {}, 'prevId');
      
      expect(result).toEqual({
        success: true,
        message: 'Hello! How can I help you today?',
        last_response_id: 'abc123',
        project_name: null
      });
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4.1',
          instructions: 'You are a helpful assistant.',
          input: 'Hi',
          temperature: 0.7,
          previous_response_id: 'prevId'
        })
      );
    });

    it('should return success and message without last_response_id when not provided', async () => {
      const mockResponse = {
        output_text: 'Hi there! Nice to meet you.',
        id: 'xyz789'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const result = await openaiService.createChatCompletion('Hello');
      
      expect(result).toEqual({
        success: true,
        message: 'Hi there! Nice to meet you.',
        last_response_id: 'xyz789',
        project_name: null
      });
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4.1',
          instructions: 'You are a helpful assistant.',
          input: 'Hello',
          temperature: 0.7
        })
      );
      
      // Should not include last_response_id when null
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          last_response_id: expect.anything()
        })
      );
    });

    it('should return fixed test response when test parameter is true', async () => {
      const result = await openaiService.createChatCompletion('Test prompt', {}, null, true, 'test-project');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Test prompt');
      expect(result.message).toMatch(/^(This is a test response|Test mode activated|Mock response|This is a simulated|Test response generated|Fake AI response|Mock completion|Test environment|Simulated chat|Development mode)/);
      expect(result.last_response_id).toMatch(/^test-response-id-[a-z0-9]+$/);
      expect(result.project_name).toBe('test-project');
      
      // Should not call the OpenAI API when in test mode
      expect(openaiService.client.responses.create).not.toHaveBeenCalled();
    });

    it('should handle null projectName in test mode', async () => {
      const result = await openaiService.createChatCompletion('Test prompt', {}, null, true, null);
      
      expect(result.success).toBe(true);
      expect(result.project_name).toBeNull();
    });

    it('should include projectName in successful responses', async () => {
      const mockResponse = {
        output_text: 'Hello! How can I help you today?',
        id: 'abc123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const result = await openaiService.createChatCompletion('Hi', {}, null, false, 'my-project');
      
      expect(result).toEqual({
        success: true,
        message: 'Hello! How can I help you today?',
        last_response_id: 'abc123',
        project_name: 'my-project'
      });
    });

    it('should handle null projectName in normal mode', async () => {
      const mockResponse = {
        output_text: 'Hello! How can I help you today?',
        id: 'abc123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const result = await openaiService.createChatCompletion('Hi', {}, null, false, null);
      
      expect(result).toEqual({
        success: true,
        message: 'Hello! How can I help you today?',
        last_response_id: 'abc123',
        project_name: null
      });
    });

    it('should merge custom options with defaults', async () => {
      const mockResponse = {
        output_text: 'Custom response',
        id: 'def456'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const customOptions = {
        model: 'gpt-4',
        temperature: 0.5,
        max_tokens: 200,
        instructions: 'You are a coding assistant.'
      };
      
      const result = await openaiService.createChatCompletion('Write a function', customOptions);
      
      expect(result.success).toBe(true);
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          instructions: 'You are a coding assistant.',
          input: 'Write a function',
          temperature: 0.5,
          max_tokens: 200
        })
      );
    });

    it('should handle null lastResponseId correctly', async () => {
      const mockResponse = {
        output_text: 'Response with null lastResponseId',
        id: 'ghi789'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const result = await openaiService.createChatCompletion('Test', {}, null);
      
      expect(result.success).toBe(true);
      
      // Should not include last_response_id when explicitly null
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          last_response_id: expect.anything()
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle insufficient_quota error', async () => {
      const error = new Error('Quota exceeded');
      error.code = 'insufficient_quota';
      
      openaiService.client.responses.create.mockRejectedValue(error);
      
      const result = await openaiService.createChatCompletion('Hi');
      
      expect(result).toEqual({
        success: false,
        error: "You've exceeded your API quota. Please check your billing details or upgrade your plan.",
        type: 'insufficient_quota',
        code: 'insufficient_quota',
        details: "Visit https://platform.openai.com/account/billing to manage your quota"
      });
      
      expect(logger.error).toHaveBeenCalledWith('Error in OpenAI service:', error);
    });

    it('should handle generic errors with type and code', async () => {
      const error = new Error('Something went wrong');
      error.type = 'api_error';
      error.code = '500';
      
      openaiService.client.responses.create.mockRejectedValue(error);
      
      const result = await openaiService.createChatCompletion('Hi');
      
      expect(result).toEqual({
        success: false,
        error: 'Something went wrong',
        type: 'api_error',
        code: '500'
      });
      
      expect(logger.error).toHaveBeenCalledWith('Error in OpenAI service:', error);
    });

    it('should handle errors without type and code', async () => {
      const error = new Error('Unknown error');
      
      openaiService.client.responses.create.mockRejectedValue(error);
      
      const result = await openaiService.createChatCompletion('Hi');
      
      expect(result).toEqual({
        success: false,
        error: 'Unknown error',
        type: 'unknown',
        code: 'unknown'
      });
      
      expect(logger.error).toHaveBeenCalledWith('Error in OpenAI service:', error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network timeout');
      error.code = 'ECONNRESET';
      
      openaiService.client.responses.create.mockRejectedValue(error);
      
      const result = await openaiService.createChatCompletion('Hi');
      
      expect(result).toEqual({
        success: false,
        error: 'Network timeout',
        type: 'unknown',
        code: 'ECONNRESET'
      });
      
      expect(logger.error).toHaveBeenCalledWith('Error in OpenAI service:', error);
    });
  });

  describe('payload construction', () => {
    it('should construct payload with all required fields', async () => {
      const mockResponse = {
        output_text: 'Test response',
        id: 'test123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      await openaiService.createChatCompletion('Test prompt');
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith({
        model: 'gpt-4.1',
        instructions: 'You are a helpful assistant.',
        input: 'Test prompt',
        temperature: 0.7
      });
    });

    it('should override default instructions when provided', async () => {
      const mockResponse = {
        output_text: 'Test response',
        id: 'test123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const options = {
        instructions: 'You are a specialized math tutor.'
      };
      
      await openaiService.createChatCompletion('Solve 2x + 5 = 15', options);
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          instructions: 'You are a specialized math tutor.'
        })
      );
    });

    it('should handle empty options object', async () => {
      const mockResponse = {
        output_text: 'Test response',
        id: 'test123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      await openaiService.createChatCompletion('Test prompt', {});
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith({
        model: 'gpt-4.1',
        instructions: 'You are a helpful assistant.',
        input: 'Test prompt',
        temperature: 0.7
      });
    });
  });
}); 