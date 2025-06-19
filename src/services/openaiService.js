const OpenAI = require('openai');
const fetch = require('node-fetch');
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

  async createChatCompletion(prompt, options = {}, lastResponseId = null, test = false, projectName = null, skipProjectPrompt = false) {
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
      else{
        if (projectName && !skipProjectPrompt) {
          const projectPromptResult = await this.makeProjectPrompt(projectName);
          if (projectPromptResult.success) {
            payload.previous_response_id = projectPromptResult.openaiResponseId;
          }
        }
        
        // Detect language from the first message and set context
        const detectedLanguage = this.detectLanguage(prompt);
        const languageInstruction = this.getLanguageInstruction(detectedLanguage);
        
        // Update instructions to include language context
        if (payload.instructions) {
          payload.instructions += ` ${languageInstruction}`;
        } else {
          payload.instructions = `You are a helpful assistant. ${languageInstruction}`;
        }
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


  async makeProjectPrompt(projectName) {
    try {
      const baseUrl = process.env.PROJECT_API_BASE_URL || 'https://c025-41-36-124-130.ngrok-free.app';
      const response = await fetch(`${baseUrl}/${projectName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.info(`Successfully fetched project prompt for: ${projectName}`);
      
      // Format the project data into a comprehensive prompt
      const projectData = data.data;
      const formattedPrompt = this.formatProjectDataToPrompt(projectData);
      
      // Send the formatted prompt to OpenAI
      const openaiResult = await this.createChatCompletion(formattedPrompt, {
        instructions: "You are a professional real estate consultant. Use the provided project information to help potential buyers and guide them towards scheduling a meeting or call with our sales team.",
        temperature: 0.7
      }, null, false, projectName, true);
      
      return {
        success: true,
        openaiResponseId: openaiResult.last_response_id,
      };
    } catch (error) {
      logger.error(`Error fetching project prompt for ${projectName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatProjectDataToPrompt(projectData) {
    const {
      name,
      developer_name,
      area_name,
      min_price,
      max_price,
      min_area,
      max_area,
      min_bedrooms,
      max_bedrooms,
      min_bathrooms,
      max_bathrooms,
      business_type,
      property_types_names,
      finishing,
      min_delivery_date,
      max_delivery_date,
      financing_eligibility,
      min_installments,
      max_installments,
      min_down_payment,
      max_down_payment,
      bruchure
    } = projectData;

    const prompt = `You are a professional real estate consultant representing ${developer_name} for the ${name} project located in ${area_name}. 

PROJECT OVERVIEW:
- Project Name: ${name}
- Developer: ${developer_name}
- Location: ${area_name}
- Business Type: ${business_type}
- Delivery Period: ${new Date(min_delivery_date).toLocaleDateString()} to ${new Date(max_delivery_date).toLocaleDateString()}

PROPERTY SPECIFICATIONS:
- Price Range: ${min_price ? `EGP ${min_price.toLocaleString()}` : 'Contact for pricing'} to ${max_price ? `EGP ${max_price.toLocaleString()}` : 'Contact for pricing'}
- Area Range: ${min_area} to ${max_area} sqm
- Bedrooms: ${min_bedrooms} to ${max_bedrooms} bedrooms
- Bathrooms: ${min_bathrooms} to ${max_bathrooms} bathrooms

AVAILABLE PROPERTY TYPES:
${Object.entries(property_types_names).map(([type, count]) => `- ${type}: ${count} units available`).join('\n')}

FINISHING OPTIONS:
${Object.entries(finishing).map(([finish, count]) => `- ${finish.replace('_', ' ').toUpperCase()}: ${count} units`).join('\n')}

FINANCING INFORMATION:
- Financing Available: ${financing_eligibility ? 'Yes' : 'No'}
- Installment Range: ${min_installments ? `EGP ${min_installments.toLocaleString()}` : 'Contact for details'} to ${max_installments ? `EGP ${max_installments.toLocaleString()}` : 'Contact for details'}
- Down Payment: ${min_down_payment}% to ${max_down_payment}%

BROCHURES AVAILABLE: ${bruchure.length} different brochures available for detailed information.

YOUR ROLE:
You are speaking with a potential buyer who is interested in this project. Your goal is to:
1. Answer any questions they have about the project details, specifications, pricing, and availability
2. Provide helpful information about the location, developer reputation, and project features
3. Understand their specific needs and preferences
4. Guide them towards scheduling a meeting or call with our sales team for detailed consultation
5. Be professional, knowledgeable, and helpful while maintaining a consultative approach

IMPORTANT GUIDELINES:
- Always be helpful and informative
- If you don't have specific information, suggest they speak with our sales team
- Encourage them to schedule a meeting or call for detailed consultation
- Be enthusiastic about the project while remaining professional
- Ask qualifying questions to understand their needs better
- Mention that you can arrange viewings or detailed consultations

Remember: Your ultimate goal is to help qualify this lead and encourage them to book a meeting or call with our sales team for personalized assistance.`;

    return prompt;
  }

  detectLanguage(text) {
    // Simple language detection based on common patterns
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const englishPattern = /^[a-zA-Z\s.,!?;:'"()-]+$/;
    
    if (arabicPattern.test(text)) {
      return 'arabic';
    } else if (englishPattern.test(text) || text.match(/[a-zA-Z]/)) {
      return 'english';
    } else {
      // Default to English if language cannot be determined
      return 'english';
    }
  }

  getLanguageInstruction(language) {
    switch (language) {
      case 'arabic':
        return 'Always respond in Arabic language. Use formal Arabic when appropriate.';
      case 'english':
        return 'Always respond in English language.';
      default:
        return 'Always respond in English language.';
    }
  }

}

module.exports = new OpenAIService(); 