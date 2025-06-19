const OpenAI = require('openai');
const fetch = require('node-fetch');
const logger = require('../utils/logger');
const datasetService = require('./datasetService');

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

      //console.log("api key", apiKey);
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
      
      // Initialize datasetContext variable
      let datasetContext = { success: false, contextInfo: null };
      
      // Always load dataset context for comprehensive responses
      datasetContext = await this.getDatasetContext(prompt, projectName);
      
      // Detect language from the current prompt (not conversation history)
      const detectedLanguage = this.detectLanguage(prompt);
      const languageInstruction = this.getLanguageInstruction(detectedLanguage);
      
      if (lastResponseId !== null) {
        payload.previous_response_id = lastResponseId;
        
        // For conversation continuations, enhance the prompt with dataset context and language instruction
        let enhancedPrompt = prompt;
        
        if (datasetContext.success && datasetContext.context) {
          enhancedPrompt += `\n\nCONTEXT: ${datasetContext.context}`;
        }
        
        // Add language instruction to the prompt
        enhancedPrompt += `\n\nINSTRUCTION: ${languageInstruction}`;
        
        payload.input = enhancedPrompt;
      }
      else{
        if (projectName && !skipProjectPrompt) {
          const projectPromptResult = await this.makeProjectPrompt(projectName);
          if (projectPromptResult.success) {
            payload.previous_response_id = projectPromptResult.openaiResponseId;
          }
        }
        
        // Update instructions to include language context and dataset information
        let enhancedInstructions = `You are a professional real estate consultant with access to comprehensive project data. ${languageInstruction}`;
        
        if (datasetContext.success && datasetContext.context) {
          enhancedInstructions += `\n\n${datasetContext.context}`;
        }
        
        if (payload.instructions) {
          payload.instructions = `${enhancedInstructions}\n\n${payload.instructions}`;
        } else {
          payload.instructions = enhancedInstructions;
        }
      }

      const response = await this.client.responses.create(payload);

      return {
        success: true,
        message: response.output_text,
        last_response_id: response.id,
        project_name: projectName,
        dataset_used: datasetContext?.success || false,
        context_info: datasetContext?.contextInfo || null
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

  async getDatasetContext(prompt, projectName) {
    try {
      // Load dataset if not already loaded
      const loadResult = await datasetService.loadDataset();
      if (!loadResult.success) {
        logger.warn('Dataset not available:', loadResult.error);
        return { success: false, error: loadResult.error };
      }

      let contextInfo = `Market Overview: ${loadResult.count} total projects available.`;
      let relevantProjects = [];
      let similarProjects = [];

      // Get specific project if mentioned
      if (projectName) {
        const projectResult = await datasetService.getProjectByName(projectName);
        if (projectResult.success) {
          relevantProjects.push(projectResult.project);
          
          // Get similar projects
          const similarResult = await datasetService.getSimilarProjects(projectName, 3);
          if (similarResult.success) {
            similarProjects = similarResult.projects;
          }
        }
      }

      // Search for projects based on prompt keywords
      const searchKeywords = this.extractSearchKeywords(prompt);
      if (searchKeywords.length > 0) {
        const searchResult = await datasetService.searchProjects(searchKeywords.join(' '));
        
        if (searchResult.success && searchResult.projects.length > 0) {
          relevantProjects = [...relevantProjects, ...searchResult.projects.slice(0, 5)];
        }
      }

      // Remove duplicates
      relevantProjects = relevantProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.name === project.name)
      );

      // Format context
      let context = '';
      
      if (relevantProjects.length > 0) {
        context += `\n\nRELEVANT PROJECTS:\n${datasetService.formatProjectsForPrompt(relevantProjects)}`;
        contextInfo += ` ${relevantProjects.length} relevant projects found.`;
      }

      if (similarProjects.length > 0) {
        context += `\n\nSIMILAR ALTERNATIVES:\n${datasetService.formatProjectsForPrompt(similarProjects)}`;
        contextInfo += ` ${similarProjects.length} similar alternatives available.`;
      }

      // Add market insights if no specific projects found
      if (relevantProjects.length === 0 && similarProjects.length === 0) {
        const insightsResult = await datasetService.getMarketInsights();
        if (insightsResult.success) {
          const insights = insightsResult.insights;
          context += `\n\nMARKET OVERVIEW:
- Total Projects: ${insights.totalProjects}
- Price Range: EGP ${insights.priceRange.min.toLocaleString()} - ${insights.priceRange.max.toLocaleString()}
- Average Price: EGP ${insights.priceRange.avg.toLocaleString()}
- Available Areas: ${insights.areas.join(', ')}
- Top Developers: ${insights.developers.slice(0, 5).join(', ')}
- Projects with Financing: ${insights.financingAvailable}`;
        }
      }

      // Add comparison capabilities
      context += `\n\nCOMPARISON CAPABILITIES:
- You can compare any projects mentioned by the user
- Provide price comparisons, location benefits, and financing options
- Suggest alternatives based on user preferences
- Always mention specific project names when making comparisons`;

      return {
        success: true,
        context,
        contextInfo
      };
    } catch (error) {
      logger.error('Error getting dataset context:', error);
      return { success: false, error: error.message };
    }
  }

  extractSearchKeywords(prompt) {
    const keywords = [];
    const lowerPrompt = prompt.toLowerCase();
    
    // Common real estate terms
    const realEstateTerms = [
      'new cairo', 'madinaty', 'rehab', '6th of october', 'shorouk', 'sheikh zayed',
      'apartment', 'villa', 'duplex', 'penthouse', 'studio',
      'bedroom', 'bathroom', 'sqm', 'square meter', 'meter',
      'price', 'cost', 'budget', 'expensive', 'cheap', 'affordable', 'cheapest',
      'financing', 'installment', 'down payment', 'cash',
      'delivery', 'ready', 'under construction', 'finished',
      'developer', 'area', 'location', 'compound', 'project'
    ];

    realEstateTerms.forEach(term => {
      if (lowerPrompt.includes(term)) {
        keywords.push(term);
      }
    });

    return keywords;
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

    const prompt = `You are a real estate consultant for ${name} by ${developer_name} in ${area_name}.

    KEY PROJECT INFO:
    - Price: EGP ${min_price?.toLocaleString() || 'Contact'} - ${max_price?.toLocaleString() || 'Contact'}
    - Size: ${min_area}-${max_area} sqm
    - Bedrooms: ${min_bedrooms}-${max_bedrooms}
    - Delivery: ${new Date(min_delivery_date).toLocaleDateString()}
    - Financing: ${financing_eligibility ? `Yes (${min_down_payment}%-${max_down_payment}% down)` : 'No'}
    
    LANGUAGE ADAPTATION:
    - Mirror the client's language (Arabic/English/Mixed)
    - If they use Egyptian slang, respond naturally but keep it professional
    - OK: "ايوة، الشقة دي ممتازة" / "اه متاح تقسيط"
    - NOT OK: Being too casual or using street slang
    - Mix languages naturally if they do: "الproject ده في location ممتاز"
    
    RESPONSE RULES:
    1. Give DIRECT, CONCISE answers (2-3 sentences max per response)
    2. State facts, not fluff
    3. If info is missing, say "I'll have our team provide that" - don't elaborate
    4. End responses with ONE clear action: "Would you like to [specific action]?"
    5. Adapt formality to match client (but stay professional)
    
    CONVERSATION FLOW:
    - Answer → Qualify need → Book meeting
    - Don't over-explain or repeat information
    - Focus on their specific question only
    
    BOOKING SCRIPT:
    Formal: "I can schedule a consultation with our sales team for [specific day/time]. Which works for you?"
    Semi-formal: "نقدر نحجزلك meeting مع الsales team يوم [specific day/time]. ايه رأيك?"
    
    Remember: Be helpful but BRIEF. Match their style while keeping it professional.`;

    return prompt;
  }

  detectLanguage(text) {
    // Simple language detection based on common patterns
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const englishPattern = /^[a-zA-Z\s.,!?;:'"()-]+$/;
    
    // Clean the text and focus on the current prompt
    const cleanText = text.trim();
    
    if (arabicPattern.test(cleanText)) {
      return 'arabic';
    } else if (englishPattern.test(cleanText) || cleanText.match(/[a-zA-Z]/)) {
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