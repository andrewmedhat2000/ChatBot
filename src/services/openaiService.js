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
      
      // Detect language from the current prompt
      const detectedLanguage = this.detectLanguage(prompt);
      const languageInstruction = this.getLanguageInstruction(detectedLanguage);
      
      if (lastResponseId !== null) {
        // Phase 2: Follow-up Questions (With last_response_id) - Detailed Analysis
        return await this.handlePhase2Question(prompt, payload, lastResponseId, projectName, detectedLanguage, languageInstruction);
      } else {
        // Phase 1: First Question (No last_response_id) - Brief Project Overview
        return await this.handlePhase1Question(prompt, payload, projectName, skipProjectPrompt, detectedLanguage, languageInstruction);
      }
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

  async handlePhase1Question(prompt, payload, projectName, skipProjectPrompt, detectedLanguage, languageInstruction) {
    try {
      // Initialize datasetContext for basic project overview
      let datasetContext = { success: false, contextInfo: null };
      
      // Load basic dataset context (no detailed properties)
      datasetContext = await this.getBasicDatasetContext(prompt, projectName);
      
      if (projectName && !skipProjectPrompt) {
        const projectPromptResult = await this.makeProjectPrompt(projectName);
        if (projectPromptResult.success) {
          payload.previous_response_id = projectPromptResult.openaiResponseId;
        }
      }
      
      // Phase 1 Instructions: Brief overview only
      let enhancedInstructions = `You are a professional real estate consultant. ${languageInstruction}

PHASE 1 RESPONSE RULES:
- Provide 2-3 sentence brief project overview
- Include project name, location, developer
- Mention available property types and unit counts
- NO detailed pricing or financing information
- NO specific property details
- Simple call-to-action asking what they need
- Keep responses concise and welcoming

PROFESSIONAL COMMUNICATION RULES:
- NEVER say "based on the available data", "according to the data", "the data shows", or similar phrases
- NEVER mention data sources, datasets, or technical details to customers
- Speak with confidence and authority as a real estate expert
- Present information as definitive facts, not as data analysis
- Use professional, client-facing language at all times
- Avoid any language that suggests uncertainty or data limitations

EXAMPLE RESPONSE FORMAT:
"[Project Name] by [Developer] in [Location] offers [property types] with [unit count] units available. [Brief location benefit]. What specific information are you looking for about this project?"`;

      if (datasetContext.success && datasetContext.context) {
        enhancedInstructions += `\n\n${datasetContext.context}`;
      }
      
      if (payload.instructions) {
        payload.instructions = `${enhancedInstructions}\n\n${payload.instructions}`;
      } else {
        payload.instructions = enhancedInstructions;
      }

      const response = await this.client.responses.create(payload);

      return {
        success: true,
        message: response.output_text,
        last_response_id: response.id,
        project_name: projectName,
        dataset_used: datasetContext?.success || false,
        context_info: datasetContext?.contextInfo || null,
        phase: 1
      };
    } catch (error) {
      logger.error('Error in Phase 1 question handling:', error);
      throw error;
    }
  }

  async handlePhase2Question(prompt, payload, lastResponseId, projectName, detectedLanguage, languageInstruction) {
    try {
      payload.previous_response_id = lastResponseId;
      
      // Phase 2: Get detailed properties data for comprehensive analysis
      const detailedContext = await this.getDetailedDatasetContext(prompt, projectName);
      
      // Enhance the prompt with detailed context and language instruction
      let enhancedPrompt = prompt;
      
      if (detailedContext.success && detailedContext.context) {
        enhancedPrompt += `\n\nDETAILED CONTEXT: ${detailedContext.context}`;
      }
      
      // Add language instruction to the prompt
      enhancedPrompt += `\n\nINSTRUCTION: ${languageInstruction}`;
      
      payload.input = enhancedPrompt;
      
      // Phase 2 Instructions: Detailed analysis
      let enhancedInstructions = `You are a professional real estate consultant with access to comprehensive property data. ${languageInstruction}

PHASE 2 RESPONSE RULES:
- Use detailed properties data analysis
- Provide exact price ranges, financing terms, delivery dates
- Filter by property type and business type when relevant
- Include specific, accurate information from properties array
- Provide detailed comparisons and alternatives
- Include financing details, down payments, installments
- Mention specific property features and finishing options
- End with clear next steps or booking options

PROFESSIONAL COMMUNICATION RULES:
- NEVER say "based on the available data", "according to the data", "the data shows", or similar phrases
- NEVER mention data sources, datasets, or technical details to customers
- Speak with confidence and authority as a real estate expert
- Present information as definitive facts, not as data analysis
- Use professional, client-facing language at all times
- Avoid any language that suggests uncertainty or data limitations

DELIVERY DATE FILTERING:
- Only mention properties with delivery dates in the future or today
- Do not include properties with past delivery dates
- If a property has no delivery date, it may be ready for immediate delivery
- Always verify delivery dates before making claims about availability

DETAILED ANALYSIS CAPABILITIES:
- Exact pricing for specific property types
- Financing terms and installment plans
- Delivery dates and construction status
- Property features and finishing options
- Business type comparisons (primary vs resale)
- Location benefits and amenities
- Developer reputation and track record

IMPORTANT DATA LIMITATIONS:
- Some projects may have undefined property type information
- When property types are undefined, focus on business type (resale vs developer_sale)
- Always verify data availability before making claims
- If specific data is not available, clearly state this limitation
- Only show properties with valid future delivery dates

RESPONSE ACCURACY:
- Only state information that is confirmed in the data
- If no resale properties exist for a project, clearly state this
- If property type information is limited, explain what is available
- Always base responses on actual data, not assumptions
- Never mention properties with past delivery dates as available
- Present all information as definitive facts, not data analysis`;

      if (payload.instructions) {
        payload.instructions = `${enhancedInstructions}\n\n${payload.instructions}`;
      } else {
        payload.instructions = enhancedInstructions;
      }

      const response = await this.client.responses.create(payload);

      return {
        success: true,
        message: response.output_text,
        last_response_id: response.id,
        project_name: projectName,
        dataset_used: detailedContext?.success || false,
        context_info: detailedContext?.contextInfo || null,
        phase: 2
      };
    } catch (error) {
      logger.error('Error in Phase 2 question handling:', error);
      throw error;
    }
  }

  async getBasicDatasetContext(prompt, projectName) {
    try {
      // Load dataset if not already loaded
      const loadResult = await datasetService.loadDataset();
      if (!loadResult.success) {
        logger.warn('Dataset not available:', loadResult.error);
        return { success: false, error: loadResult.error };
      }

      let contextInfo = `Market Overview: ${loadResult.count} total projects available.`;
      let relevantProjects = [];

      // Get specific project if mentioned
      if (projectName) {
        const projectResult = await datasetService.getProjectByName(projectName);
        if (projectResult.success) {
          relevantProjects.push(projectResult.project);
        }
      }

      // Search for projects based on prompt keywords
      const searchKeywords = this.extractSearchKeywords(prompt);
      if (searchKeywords.length > 0) {
        const searchResult = await datasetService.searchProjects(searchKeywords.join(' '));
        
        if (searchResult.success && searchResult.projects.length > 0) {
          relevantProjects = [...relevantProjects, ...searchResult.projects.slice(0, 3)];
        }
      }

      // Remove duplicates
      relevantProjects = relevantProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.name === project.name)
      );

      // Format basic context (no detailed pricing/financing)
      let context = '';
      
      if (relevantProjects.length > 0) {
        context += `\n\nBASIC PROJECT OVERVIEW:\n${this.formatBasicProjectInfo(relevantProjects)}`;
        contextInfo += ` ${relevantProjects.length} relevant projects found.`;
      }

      // Add basic market insights if no specific projects found
      if (relevantProjects.length === 0) {
        const insightsResult = await datasetService.getMarketInsights();
        if (insightsResult.success) {
          const insights = insightsResult.insights;
          context += `\n\nMARKET OVERVIEW:
- Total Projects: ${insights.totalProjects}
- Available Areas: ${insights.areas.join(', ')}
- Top Developers: ${insights.developers.slice(0, 5).join(', ')}`;
        }
      }

      return {
        success: true,
        context,
        contextInfo
      };
    } catch (error) {
      logger.error('Error getting basic dataset context:', error);
      return { success: false, error: error.message };
    }
  }

  async getDetailedDatasetContext(prompt, projectName) {
    try {
      // Load dataset if not already loaded
      const loadResult = await datasetService.loadDataset();
      if (!loadResult.success) {
        logger.warn('Dataset not available:', loadResult.error);
        return { success: false, error: loadResult.error };
      }

      let contextInfo = `Detailed Analysis: ${loadResult.count} total projects available.`;
      let relevantProjects = [];
      let detailedProperties = [];

      // Get specific project if mentioned
      if (projectName) {
        const projectResult = await datasetService.getProjectByName(projectName);
        if (projectResult.success) {
          relevantProjects.push(projectResult.project);
          
          // Get detailed properties for this project
          const propertiesResult = await datasetService.getProperties(projectName);
          if (propertiesResult.success) {
            detailedProperties = propertiesResult.properties;
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

      // Format detailed context with properties data
      let context = '';
      
      if (relevantProjects.length > 0) {
        context += `\n\nDETAILED PROJECT ANALYSIS:\n${datasetService.formatProjectsForPrompt(relevantProjects)}`;
        contextInfo += ` ${relevantProjects.length} relevant projects found.`;
      }

      if (detailedProperties.length > 0) {
        context += `\n\nDETAILED PROPERTIES DATA:\n${this.formatDetailedProperties(detailedProperties)}`;
        contextInfo += ` ${detailedProperties.length} detailed properties available.`;
      }

      // Add property types information if available
      if (projectName) {
        const propertyTypesResult = await datasetService.getPropertyTypes(projectName);
        if (propertyTypesResult.success) {
          context += `\n\nPROPERTY TYPES BREAKDOWN:\n${this.formatPropertyTypes(propertyTypesResult.propertyTypes)}`;
        }
      }

      return {
        success: true,
        context,
        contextInfo
      };
    } catch (error) {
      logger.error('Error getting detailed dataset context:', error);
      return { success: false, error: error.message };
    }
  }

  formatBasicProjectInfo(projects) {
    if (!projects || projects.length === 0) {
      return 'No projects available.';
    }

    return projects.map(project => {
      const areaRange = project.min_area && project.max_area 
        ? `${project.min_area}-${project.max_area} sqm`
        : 'Various sizes available';
      
      const bedroomRange = project.min_bedrooms && project.max_bedrooms 
        ? `${project.min_bedrooms}-${project.max_bedrooms} bedrooms`
        : 'Various configurations';

      const propertyTypes = project.property_types_names || 'Various types available';
      const deliveryDate = project.min_delivery_date 
        ? new Date(project.min_delivery_date).toLocaleDateString()
        : 'Various delivery dates';

      return `• ${project.name} by ${project.developer_name} in ${project.area_name}
  - Property Types: ${propertyTypes}
  - Size Range: ${areaRange}
  - Bedrooms: ${bedroomRange}
  - Delivery: ${deliveryDate}
  - Financing: ${project.financing_eligibility ? 'Available' : 'Contact for details'}`;
    }).join('\n\n');
  }

  formatDetailedProperties(properties) {
    if (!properties || properties.length === 0) {
      return 'No detailed properties available.';
    }

    return properties.map((property, index) => {
      // Price formatting
      let price;
      if (property.price) {
        price = `EGP ${property.price.toLocaleString()}`;
      } else if (property.min_price && property.max_price && property.min_price !== property.max_price) {
        price = `EGP ${property.min_price.toLocaleString()} - EGP ${property.max_price.toLocaleString()}`;
      } else if (property.min_price) {
        price = `EGP ${property.min_price.toLocaleString()}`;
      } else if (property.max_price) {
        price = `EGP ${property.max_price.toLocaleString()}`;
      } else {
        price = 'Contact for pricing';
      }

      // Area formatting
      let area;
      if (property.area) {
        area = `${property.area} sqm`;
      } else if (property.min_area && property.max_area && property.min_area !== property.max_area) {
        area = `${property.min_area}-${property.max_area} sqm`;
      } else if (property.min_area) {
        area = `${property.min_area} sqm`;
      } else if (property.max_area) {
        area = `${property.max_area} sqm`;
      } else {
        area = 'Contact for details';
      }

      const bedrooms = property.bedrooms || property.min_bedrooms || 'Contact for details';
      const bathrooms = property.bathrooms || property.min_bathrooms || 'Contact for details';
      const finishing = property.finishing || 'Contact for details';
      
      // Delivery date formatting
      let deliveryDate;
      if (property.min_delivery_date && property.max_delivery_date) {
        const minDate = new Date(property.min_delivery_date);
        const maxDate = new Date(property.max_delivery_date);
        if (minDate.getTime() === maxDate.getTime()) {
          deliveryDate = minDate.toLocaleDateString();
        } else {
          deliveryDate = `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
        }
      } else if (property.min_delivery_date) {
        deliveryDate = new Date(property.min_delivery_date).toLocaleDateString();
      } else if (property.max_delivery_date) {
        deliveryDate = new Date(property.max_delivery_date).toLocaleDateString();
      } else {
        deliveryDate = 'Contact for details';
      }
      
      // Financing formatting
      let financing;
      
      // Check if we have installment or down payment data
      const hasInstallmentData = property.installments || property.min_installments || property.max_installments;
      const hasDownPaymentData = property.down_payment || property.min_down_payment || property.max_down_payment;
      
      if (property.financing_available || hasInstallmentData || hasDownPaymentData) {
        // Down payment formatting
        let downPayment;
        if (property.down_payment) {
          downPayment = `${property.down_payment}%`;
        } else if (property.min_down_payment && property.max_down_payment && property.min_down_payment !== property.max_down_payment) {
          downPayment = `${property.min_down_payment}%-${property.max_down_payment}%`;
        } else if (property.min_down_payment) {
          downPayment = `${property.min_down_payment}%`;
        } else if (property.max_down_payment) {
          downPayment = `${property.max_down_payment}%`;
        } else {
          downPayment = 'Contact for details';
        }
        
        // Installment formatting
        let installments;
        if (property.installments) {
          installments = `${property.installments} years`;
        } else if (property.min_installments && property.max_installments && property.min_installments !== property.max_installments) {
          installments = `${property.min_installments.toLocaleString()} - ${property.max_installments.toLocaleString()} EGP/month`;
        } else if (property.min_installments) {
          installments = `${property.min_installments.toLocaleString()} EGP/month`;
        } else if (property.max_installments) {
          installments = `${property.max_installments.toLocaleString()} EGP/month`;
        } else {
          installments = 'Contact for details';
        }
        
        financing = `Yes (${downPayment} down, ${installments})`;
      } else {
        financing = 'No';
      }

      return `${index + 1}. ${property.property_type_name || ''} - ${property.business_type || ''}
  - Price: ${price}
  - Area: ${area}
  - Bedrooms: ${bedrooms} | Bathrooms: ${bathrooms}
  - Finishing: ${finishing}
  - Delivery: ${deliveryDate}
  - Financing: ${financing}
  - Project: ${property.project_name} by ${property.project_developer}`;
    }).join('\n\n');
  }

  formatPropertyTypes(propertyTypes) {
    if (!propertyTypes || propertyTypes.length === 0) {
      return 'No property types available.';
    }

    return propertyTypes.map(pt => {
      const priceRange = pt.price_range.min && pt.price_range.max 
        ? `EGP ${pt.price_range.min.toLocaleString()} - ${pt.price_range.max.toLocaleString()}`
        : 'Contact for pricing';
      
      const areaRange = pt.area_range.min && pt.area_range.max 
        ? `${pt.area_range.min}-${pt.area_range.max} sqm`
        : 'Various sizes';

      return `• ${pt.name}
  - Properties Available: ${pt.properties_count}
  - Price Range: ${priceRange}
  - Size Range: ${areaRange}
  - Business Types: ${pt.business_types.join(', ')}`;
    }).join('\n\n');
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

    PHASE 1 PROJECT OVERVIEW:
    - Project: ${name} by ${developer_name}
    - Location: ${area_name}
    - Property Types: ${property_types_names || 'Various types available'}
    - Size Range: ${min_area}-${max_area} sqm
    - Bedrooms: ${min_bedrooms}-${max_bedrooms}
    - Delivery: ${new Date(min_delivery_date).toLocaleDateString()}
    - Financing: ${financing_eligibility ? 'Available' : 'Contact for details'}
    
    PHASE 1 RESPONSE RULES:
    1. Provide 2-3 sentence brief project overview
    2. Include project name, location, developer
    3. Mention available property types and unit counts
    4. NO detailed pricing or financing information
    5. NO specific property details
    6. Simple call-to-action asking what they need
    7. Keep responses concise and welcoming
    
    LANGUAGE ADAPTATION:
    - Mirror the client's language (Arabic/English/Mixed)
    - If they use Egyptian slang, respond naturally but keep it professional
    - OK: "ايوة، الشقة دي ممتازة" / "اه متاح تقسيط"
    - NOT OK: Being too casual or using street slang
    - Mix languages naturally if they do: "الproject ده في location ممتاز"
    
    EXAMPLE RESPONSE FORMAT:
    "[Project Name] by [Developer] in [Location] offers [property types] with [unit count] units available. [Brief location benefit]. What specific information are you looking for about this project?"
    
    CONVERSATION FLOW:
    - Brief overview → Ask what they need → Guide to detailed info
    - Don't over-explain or provide detailed pricing
    - Focus on welcoming and gathering their specific needs
    
    Remember: This is Phase 1 - keep it brief and welcoming. Detailed information comes in follow-up questions.`;

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