const openaiService = require('./openaiService');

// Mock the logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock the datasetService
jest.mock('./datasetService', () => ({
  loadDataset: jest.fn().mockResolvedValue({
    success: true,
    count: 875,
    message: 'Dataset loaded successfully'
  }),
  getProjectByName: jest.fn().mockResolvedValue({
    success: true,
    project: {
      name: 'Test Project',
      developer_name: 'Test Developer',
      area_name: 'Test Area',
      min_price: 2000000,
      max_price: 4000000
    }
  }),
  getSimilarProjects: jest.fn().mockResolvedValue({
    success: true,
    projects: []
  }),
  searchProjects: jest.fn().mockResolvedValue({
    success: true,
    projects: [],
    count: 0,
    total: 875
  }),
  getMarketInsights: jest.fn().mockResolvedValue({
    success: true,
    insights: {
      totalProjects: 875,
      priceRange: {
        min: 1800000,
        max: 274023000,
        avg: 26464777.872
      },
      areas: ['October Gardens', 'New Cairo', '6th settlement'],
      developers: ['Orascom Development Egypt', 'Palm Hills Developments'],
      financingAvailable: 31,
      avgPrice: 26464777.872
    }
  }),
  formatProjectsForPrompt: jest.fn().mockReturnValue('Formatted project data')
}));

// Mock OpenAI
jest.mock('openai');

describe('OpenAIService.createChatCompletion', () => {
  let originalClient;
  const logger = require('../utils/logger');

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
        output_text: 'Hi there! Nice to meet you.',
        id: 'xyz789'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const result = await openaiService.createChatCompletion('Hello', {}, 'prevId');
      
      expect(result).toEqual({
        success: true,
        message: 'Hi there! Nice to meet you.',
        last_response_id: 'xyz789',
        project_name: null,
        dataset_used: true,
        context_info: expect.any(String)
      });
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4.1',
          instructions: expect.any(String),
          input: expect.stringContaining('Hello'),
          temperature: 0.7,
          previous_response_id: 'prevId'
        })
      );
    });

    it('should return success and message without last_response_id when not provided', async () => {
      const mockResponse = {
        output_text: 'Hello! How can I help you today?',
        id: 'abc123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const result = await openaiService.createChatCompletion('Hi');
      
      expect(result).toEqual({
        success: true,
        message: 'Hello! How can I help you today?',
        last_response_id: 'abc123',
        project_name: null,
        dataset_used: true,
        context_info: expect.any(String)
      });
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4.1',
          instructions: expect.stringContaining('You are a professional real estate consultant'),
          input: 'Hi',
          temperature: 0.7
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
      expect(result.dataset_used).toBeFalsy();
      expect(result.context_info).toBeUndefined();
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
        project_name: 'my-project',
        dataset_used: true,
        context_info: expect.any(String)
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
        project_name: null,
        dataset_used: true,
        context_info: expect.any(String)
      });
    });

    it('should merge custom options with defaults', async () => {
      const mockResponse = {
        output_text: 'Test response',
        id: 'test123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const options = {
        model: 'gpt-4',
        temperature: 0.5,
        max_tokens: 200,
        instructions: 'You are a coding assistant.'
      };
      
      const result = await openaiService.createChatCompletion('Write a function', options);
      
      expect(result.success).toBe(true);
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          input: 'Write a function',
          instructions: expect.stringContaining('You are a professional real estate consultant'),
          max_tokens: 200,
          model: 'gpt-4',
          temperature: 0.5
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

  describe('test mode', () => {
    it('should return test response when test is true', async () => {
      const result = await openaiService.createChatCompletion('Test prompt', {}, null, true);
      
      expect(result.success).toBe(true);
      expect(result.message).toMatch(/^(This is a test response|Test mode activated|Mock response|This is a simulated|Test response generated|Fake AI response|Mock completion|Test environment|Simulated chat|Development mode)/);
      expect(result.last_response_id).toContain('test-response-id-');
      expect(result.dataset_used).toBeFalsy();
      expect(result.context_info).toBeUndefined();
    });

    it('should return different test responses', async () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await openaiService.createChatCompletion('Test prompt', {}, null, true);
        results.push(result.message);
      }
      
      // Should get different test messages
      const uniqueMessages = new Set(results);
      expect(uniqueMessages.size).toBeGreaterThan(1);
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
        instructions: expect.stringContaining('You are a professional real estate consultant'),
        input: 'Test prompt',
        temperature: 0.7
      });
    });

    it('should merge custom options with defaults', async () => {
      const mockResponse = {
        output_text: 'Test response',
        id: 'test123'
      };
      
      openaiService.client.responses.create.mockResolvedValue(mockResponse);
      
      const options = {
        model: 'gpt-4',
        temperature: 0.5,
        max_tokens: 200,
        instructions: 'You are a coding assistant.'
      };
      
      const result = await openaiService.createChatCompletion('Write a function', options);
      
      expect(result.success).toBe(true);
      
      expect(openaiService.client.responses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          input: 'Write a function',
          instructions: expect.stringContaining('You are a professional real estate consultant'),
          max_tokens: 200,
          model: 'gpt-4',
          temperature: 0.5
        })
      );
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
          instructions: expect.stringContaining('You are a professional real estate consultant')
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
        instructions: expect.stringContaining('You are a professional real estate consultant'),
        input: 'Test prompt',
        temperature: 0.7
      });
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

  describe('language detection', () => {
    it('should detect English language', () => {
      const result = openaiService.detectLanguage('Hello, how are you?');
      expect(result).toBe('english');
    });

    it('should detect Arabic language', () => {
      const result = openaiService.detectLanguage('مرحبا، كيف حالك؟');
      expect(result).toBe('arabic');
    });

    it('should default to English for mixed content', () => {
      const result = openaiService.detectLanguage('Hello مرحبا');
      expect(result).toBe('arabic'); // Arabic characters are detected first
    });
  });

  describe('language instructions', () => {
    it('should return English instruction', () => {
      const result = openaiService.getLanguageInstruction('english');
      expect(result).toBe('Always respond in English language.');
    });

    it('should return Arabic instruction', () => {
      const result = openaiService.getLanguageInstruction('arabic');
      expect(result).toBe('Always respond in Arabic language. Use formal Arabic when appropriate.');
    });

    it('should default to English for unknown language', () => {
      const result = openaiService.getLanguageInstruction('unknown');
      expect(result).toBe('Always respond in English language.');
    });
  });
}); 