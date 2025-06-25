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

  async createChatCompletion(prompt, options = {}, lastResponseId = null, test = false, projectName = null, skipProjectPrompt = false, campaignType = 'primary') {
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
          project_name: projectName,
          campaign_type: campaignType
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
        return await this.handlePhase2Question(prompt, payload, lastResponseId, projectName, detectedLanguage, languageInstruction, campaignType);
      } else {
        // Phase 1: First Question (No last_response_id) - Brief Project Overview
        return await this.handlePhase1Question(prompt, payload, projectName, skipProjectPrompt, detectedLanguage, languageInstruction, campaignType);
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

  async handlePhase1Question(prompt, payload, projectName, skipProjectPrompt, detectedLanguage, languageInstruction, campaignType) {
    try {
      // Initialize datasetContext for basic project overview
      let datasetContext = { success: false, contextInfo: null };
      
      // Load basic dataset context (no detailed properties)
      datasetContext = await this.getBasicDatasetContext(prompt, projectName, campaignType);
      
      if (projectName && !skipProjectPrompt) {
        const projectPromptResult = await this.makeProjectPrompt(projectName, campaignType);
        if (projectPromptResult.success) {
          payload.previous_response_id = projectPromptResult.openaiResponseId;
        }
      }
      
      // Phase 1 Instructions: Brief overview only
      let enhancedInstructions = `You are a professional real estate consultant specializing in ${campaignType === 'primary' ? 'primary units (developer sales)' : 'resale properties'}. ${languageInstruction}

AUTOMATIC BUSINESS TYPE RECOGNITION:
- All data provided to you has been automatically filtered for business_type: '${campaignType === 'primary' ? 'developer_sale' : 'resale'}' (${campaignType === 'primary' ? 'primary units' : 'resale properties'} only)
- You do not need to filter data - it's already filtered for you
- All properties, prices, and information shown are ${campaignType === 'primary' ? 'PRIMARY UNITS' : 'RESALE PROPERTIES'} only
- No ${campaignType === 'primary' ? 'resale properties' : 'primary units'} are included in the data provided
- Automatically recognize that you're working with ${campaignType === 'primary' ? 'primary units' : 'resale properties'} only

PROPERTY TYPE DEFINITIONS (CRITICAL):
- PRIMARY UNITS (developer_sale): Properties sold directly by the developer/construction company
- RESALE PROPERTIES: Properties sold by individual owners who previously bought them
- PRIMARY UNITS = New construction, developer guarantees, direct from developer
- RESALE PROPERTIES = Previously owned, sold by individuals, secondary market
- NEVER confuse these two types - they are completely different markets

EXAMPLES OF PRIMARY UNITS (what you should discuss):
- "New apartments from the developer"
- "Direct developer sales"
- "Primary units with developer financing"
- "New construction units"
- "Developer guarantees and warranties"

EXAMPLES OF RESALE PROPERTIES (what you should NEVER discuss):
- "Previously owned apartments"
- "Individual owner sales"
- "Secondary market properties"
- "Resale units"
- "Owner-to-owner transactions"

CRITICAL RULES:
- If someone asks about "resale" or "previously owned" properties, redirect them to primary units
- If someone asks about "individual owners" or "secondary market", redirect them to primary units
- If someone asks about "used" or "pre-owned" properties, redirect them to primary units
- Always emphasize the benefits of buying primary units: new construction, developer guarantees, direct financing

PHASE 1 RESPONSE RULES:
- Provide 2-3 sentence brief project overview for ${campaignType === 'primary' ? 'PRIMARY UNITS' : 'RESALE PROPERTIES'} only
- Include project name, location, developer
- Mention available property types and unit counts (${campaignType === 'primary' ? 'primary units' : 'resale properties'} only)
- NO detailed pricing or financing information
- NO specific property details
- Simple call-to-action asking what they need
- Keep responses concise and welcoming
- Emphasize that you're showing ${campaignType === 'primary' ? 'primary units from the developer' : 'resale properties from individual owners'}
- If no ${campaignType === 'primary' ? 'primary units' : 'resale properties'} available, clearly state this

${campaignType === 'primary' ? 'PRIMARY UNITS' : 'RESALE PROPERTIES'} FOCUS:
- ONLY discuss ${campaignType === 'primary' ? 'developer sales (primary units)' : 'resale properties (secondary market)'}
- NEVER mention ${campaignType === 'primary' ? 'resale properties or secondary market' : 'primary units or developer sales'}
- Always clarify that you're showing ${campaignType === 'primary' ? 'primary units from the developer' : 'resale properties from individual owners'}
- Emphasize the benefits of buying ${campaignType === 'primary' ? 'directly from developers' : 'from individual owners'}

PROFESSIONAL COMMUNICATION RULES:
- NEVER say "based on the available data", "according to the data", "the data shows", or similar phrases
- NEVER mention data sources, datasets, or technical details to customers
- Speak with confidence and authority as a real estate expert
- Present information as definitive facts, not as data analysis
- Use professional, client-facing language at all times
- Avoid any language that suggests uncertainty or data limitations

EXAMPLE RESPONSE FORMAT:
"[Project Name] by [Developer] in [Location] offers [property types] with [unit count] ${campaignType === 'primary' ? 'primary units available directly from the developer' : 'resale properties available from individual owners'}. [Brief location benefit]. What specific information are you looking for about these ${campaignType === 'primary' ? 'primary units' : 'resale properties'}?"

EXAMPLE RESPONSE WHEN NO ${campaignType === 'primary' ? 'PRIMARY UNITS' : 'RESALE PROPERTIES'}:
"No ${campaignType === 'primary' ? 'primary units' : 'resale properties'} are currently available in [Project Name] by [Developer]. We only handle ${campaignType === 'primary' ? 'primary units (developer sales)' : 'resale properties (secondary market)'} and do not provide information about ${campaignType === 'primary' ? 'resale properties' : 'primary units'}. Would you like to explore other projects with available ${campaignType === 'primary' ? 'primary units' : 'resale properties'}?"

AUTOMATIC RECOGNITION:
- Automatically recognize that all data provided is already filtered for ${campaignType === 'primary' ? 'primary units' : 'resale properties'} only`;

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
        phase: 1,
        campaign_type: campaignType
      };
    } catch (error) {
      logger.error('Error in Phase 1 question handling:', error);
      throw error;
    }
  }

  async handlePhase2Question(prompt, payload, lastResponseId, projectName, detectedLanguage, languageInstruction, campaignType) {
    try {
      payload.previous_response_id = lastResponseId;
      
      // Phase 2: Get detailed properties data for comprehensive analysis
      const detailedContext = await this.getDetailedDatasetContext(prompt, projectName, campaignType);
      
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

AUTOMATIC BUSINESS TYPE RECOGNITION:
- All data provided to you has been automatically filtered for business_type: 'developer_sale' (primary units only)
- You do not need to filter data - it's already filtered for you
- All properties, prices, and information shown are PRIMARY UNITS only
- No resale properties are included in the data provided
- Automatically recognize that you're working with primary units only

CURRENT DATE CONTEXT:
- Today's date is ${new Date().toLocaleDateString()}
- Only mention properties with delivery dates in the future (after today)
- NEVER mention delivery dates in the past
- If a delivery date is in the past, do not include that property in your response

CRITICAL PRIMARY UNITS POLICY:
- ONLY discuss PRIMARY UNITS (developer sales) - NEVER mention resale properties
- If no primary units are available, clearly state: "No primary units are currently available in this project"
- NEVER provide resale property information as an alternative
- NEVER mention resale prices, resale financing, or resale availability
- If asked about resale, redirect to primary units only
- If primary units are not available, suggest other projects with primary units

PHASE 2 RESPONSE RULES:
- Focus EXCLUSIVELY on PRIMARY UNITS (developer sales) - NEVER mention resale properties
- Use detailed properties data analysis for primary units only
- Provide exact price ranges, financing terms, delivery dates for primary units
- Filter by property type and business type when relevant (developer_sale only)
- Include specific, accurate information from properties array (primary units only)
- Provide detailed comparisons and alternatives (primary units only)
- Include financing details, down payments, installments for primary units
- Mention specific property features and finishing options for primary units
- End with clear next steps or booking options

PRIMARY UNITS FOCUS:
- ONLY discuss developer sales (primary units)
- NEVER mention resale properties or secondary market
- Always clarify that you're showing primary units from the developer
- Emphasize the benefits of buying directly from developers
- Focus on new construction and developer guarantees

PROFESSIONAL COMMUNICATION RULES:
- NEVER say "based on the available data", "according to the data", "the data shows", or similar phrases
- NEVER mention data sources, datasets, or technical details to customers
- Speak with confidence and authority as a real estate expert
- Present information as definitive facts, not as data analysis
- Use professional, client-facing language at all times
- Avoid any language that suggests uncertainty or data limitations

DELIVERY DATE FILTERING (CRITICAL):
- Current date: ${new Date().toLocaleDateString()}
- ONLY mention properties with delivery dates in the future or today
- Do not include properties with past delivery dates
- If a property has no delivery date, it may be ready for immediate delivery
- Always verify delivery dates before making claims about availability
- If you see a delivery date in the past, exclude that property from your response
- Use phrases like "scheduled for delivery in [future date]" or "ready for immediate delivery"

DETAILED ANALYSIS CAPABILITIES (PRIMARY UNITS ONLY):
- Exact pricing for specific property types (developer sales)
- Financing terms and installment plans (primary units)
- Delivery dates and construction status (new construction)
- Property features and finishing options (developer specifications)
- Location benefits and amenities (developer projects)
- Developer reputation and track record
- Direct developer benefits and guarantees

IMPORTANT DATA LIMITATIONS:
- Focus ONLY on primary units (developer_sale business type)
- Some projects may have undefined property type information
- When property types are undefined, focus on business type (developer_sale only)
- Always verify data availability before making claims
- If specific data is not available, clearly state this limitation
- Only show properties with valid future delivery dates
- Current date awareness: ${new Date().toLocaleDateString()}
- If no primary units exist, state: "No primary units are currently available"

RESPONSE ACCURACY:
- Only state information that is confirmed in the data
- Focus exclusively on primary units from developers
- If property type information is limited, explain what is available
- Always base responses on actual data, not assumptions
- Never mention properties with past delivery dates as available
- Present all information as definitive facts, not data analysis
- Emphasize the advantages of buying primary units directly from developers
- Always check delivery dates against current date: ${new Date().toLocaleDateString()}
- If no primary units are available, clearly state this and do not provide resale alternatives
- Automatically recognize that all data provided is already filtered for primary units only`;

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
        phase: 2,
        campaign_type: campaignType
      };
    } catch (error) {
      logger.error('Error in Phase 2 question handling:', error);
      throw error;
    }
  }

  async getBasicDatasetContext(prompt, projectName, campaignType) {
    try {
      // Load dataset if not already loaded with campaign type
      const loadResult = await datasetService.loadDataset(campaignType);
      if (!loadResult.success) {
        logger.warn('Dataset not available:', loadResult.error);
        return { success: false, error: loadResult.error };
      }

      let contextInfo = `Market Overview: ${loadResult.count} total projects available (${campaignType} campaign).`;
      let relevantProjects = [];

      // Get specific project if mentioned
      if (projectName) {
        const projectResult = await datasetService.getProjectByName(projectName);
        if (projectResult.success) {
          // Check if project has properties available for the campaign type
          const businessType = campaignType === 'primary' ? 'developer_sale' : 'resale';
          const propertiesResult = await datasetService.getProperties(projectName, null, businessType);
          if (propertiesResult.success && propertiesResult.count > 0) {
            relevantProjects.push(projectResult.project);
          } else {
            // No properties available for this campaign type
            const propertyTypeText = campaignType === 'primary' ? 'primary units' : 'resale properties';
            context += `\n\n${propertyTypeText.toUpperCase()} STATUS: No ${propertyTypeText} are currently available in ${projectName}.`;
            contextInfo += ` No ${propertyTypeText} available.`;
          }
        }
      }

      // Search for projects based on prompt keywords
      const searchKeywords = this.extractSearchKeywords(prompt);
      if (searchKeywords.length > 0) {
        const searchResult = await datasetService.searchProjects(searchKeywords.join(' '));
        
        if (searchResult.success && searchResult.projects.length > 0) {
          // Filter to only include projects with properties for the campaign type
          const businessType = campaignType === 'primary' ? 'developer_sale' : 'resale';
          const projectsWithProperties = [];
          for (const project of searchResult.projects.slice(0, 5)) {
            const propertiesResult = await datasetService.getProperties(project.name, null, businessType);
            if (propertiesResult.success && propertiesResult.count > 0) {
              projectsWithProperties.push(project);
            }
          }
          relevantProjects = [...relevantProjects, ...projectsWithProperties];
        }
      }

      // Remove duplicates
      relevantProjects = relevantProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.name === project.name)
      );

      // Format basic context based on campaign type
      let context = '';
      const propertyTypeText = campaignType === 'primary' ? 'PRIMARY UNITS' : 'RESALE PROPERTIES';
      const businessTypeText = campaignType === 'primary' ? 'developer_sale' : 'resale';
      
      // Add business type context
      context += `\n\nBUSINESS TYPE CONTEXT: All data provided below has been filtered to show ONLY ${propertyTypeText} (business_type: '${businessTypeText}').`;
      
      if (relevantProjects.length > 0) {
        context += `\n\nBASIC PROJECT OVERVIEW (${propertyTypeText} ONLY):\n${this.formatBasicProjectInfo(relevantProjects)}`;
        contextInfo += ` ${relevantProjects.length} relevant projects with ${campaignType} properties found.`;
      } else {
        context += `\n\n${propertyTypeText} STATUS: No projects with ${campaignType} properties are currently available.`;
        contextInfo += ` No ${campaignType} properties available.`;
      }

      // Add basic market insights if no specific projects found
      if (relevantProjects.length === 0) {
        const insightsResult = await datasetService.getMarketInsights();
        if (insightsResult.success) {
          const insights = insightsResult.insights;
          context += `\n\nMARKET OVERVIEW (${propertyTypeText}):
- Total Projects: ${insights.totalProjects}
- Available Areas: ${insights.areas.join(', ')}
- Top Developers: ${insights.developers.slice(0, 5).join(', ')}
- Focus: ${propertyTypeText} only`;
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

  async getDetailedDatasetContext(prompt, projectName, campaignType) {
    try {
      // Load dataset if not already loaded with campaign type
      const loadResult = await datasetService.loadDataset(campaignType);
      if (!loadResult.success) {
        logger.warn('Dataset not available:', loadResult.error);
        return { success: false, error: loadResult.error };
      }

      let contextInfo = `Detailed Analysis: ${loadResult.count} total projects available (${campaignType} campaign).`;
      let relevantProjects = [];
      let detailedProperties = [];

      // Get specific project if mentioned
      if (projectName) {
        const projectResult = await datasetService.getProjectByName(projectName);
        if (projectResult.success) {
          relevantProjects.push(projectResult.project);
          
          // Get detailed properties for this project based on campaign type
          const businessType = campaignType === 'primary' ? 'developer_sale' : 'resale';
          const propertiesResult = await datasetService.getProperties(projectName, null, businessType);
          if (propertiesResult.success && propertiesResult.count > 0) {
            detailedProperties = propertiesResult.properties;
            const propertyTypeText = campaignType === 'primary' ? 'primary units' : 'resale properties';
            contextInfo += ` ${propertiesResult.count} ${propertyTypeText} available.`;
          } else {
            // No properties available for this campaign type
            const propertyTypeText = campaignType === 'primary' ? 'primary units' : 'resale properties';
            context += `\n\n${propertyTypeText.toUpperCase()} STATUS: No ${propertyTypeText} are currently available in ${projectName}.`;
            contextInfo += ` No ${propertyTypeText} available.`;
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

      // Format detailed context with properties data based on campaign type
      let context = '';
      const propertyTypeText = campaignType === 'primary' ? 'PRIMARY UNITS' : 'RESALE PROPERTIES';
      const businessTypeText = campaignType === 'primary' ? 'developer_sale' : 'resale';
      
      // Add current date context
      const currentDate = new Date().toLocaleDateString();
      context += `\n\nCURRENT DATE CONTEXT: Today's date is ${currentDate}. Only include properties with delivery dates in the future or today.`;
      
      // Add business type context
      context += `\n\nBUSINESS TYPE CONTEXT: All data provided below has been filtered to show ONLY ${propertyTypeText} (business_type: '${businessTypeText}').`;
      
      if (relevantProjects.length > 0) {
        context += `\n\nDETAILED PROJECT ANALYSIS (${propertyTypeText} ONLY):\n${datasetService.formatProjectsForPrompt(relevantProjects)}`;
        contextInfo += ` ${relevantProjects.length} relevant projects found.`;
      }

      if (detailedProperties.length > 0) {
        context += `\n\nDETAILED ${propertyTypeText} DATA (FILTERED FOR ${businessTypeText.toUpperCase()} ONLY):\n${this.formatDetailedProperties(detailedProperties)}`;
        contextInfo += ` ${detailedProperties.length} ${campaignType} properties available.`;
      } else {
        context += `\n\n${propertyTypeText} STATUS: No ${campaignType} properties are currently available in this project.`;
        contextInfo += ` No ${campaignType} properties available.`;
      }

      // Add property types information if available based on campaign type
      if (projectName) {
        const propertyTypesResult = await datasetService.getPropertyTypes(projectName);
        if (propertyTypesResult.success) {
          // Filter to show only properties for the campaign type
          const filteredPropertyTypes = propertyTypesResult.propertyTypes.map(pt => ({
            ...pt,
            business_types: pt.business_types.filter(bt => bt === businessTypeText),
            properties_count: pt.properties_count // This will be filtered in the formatting
          })).filter(pt => pt.business_types.length > 0);
          
          context += `\n\n${propertyTypeText} BREAKDOWN:\n${this.formatPropertyTypes(filteredPropertyTypes)}`;
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
      return 'No primary units available.';
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

      return `• PRIMARY UNITS - ${project.name} by ${project.developer_name} in ${project.area_name}
  - Property Types: ${propertyTypes}
  - Size Range: ${areaRange}
  - Bedrooms: ${bedroomRange}
  - Delivery: ${deliveryDate}
  - Financing: ${project.financing_eligibility ? 'Available' : 'Contact for details'}
  - Business Type: Developer Sale (Primary Units)`;
    }).join('\n\n');
  }

  formatDetailedProperties(properties) {
    if (!properties || properties.length === 0) {
      return 'No primary units are currently available in this project. We only handle primary units (developer sales) and do not provide information about resale properties.';
    }

    const currentDate = new Date();
    const currentDateString = currentDate.toLocaleDateString();

    const validProperties = properties.map((property, index) => {
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
      
      // Delivery date formatting with current date validation
      let deliveryDate;
      let isPastDate = false;
      
      if (property.min_delivery_date && property.max_delivery_date) {
        const minDate = new Date(property.min_delivery_date);
        const maxDate = new Date(property.max_delivery_date);
        
        // Check if both dates are in the past
        if (minDate < currentDate && maxDate < currentDate) {
          isPastDate = true;
          deliveryDate = 'Delivery date in the past - not available';
        } else if (minDate.getTime() === maxDate.getTime()) {
          if (minDate >= currentDate) {
            deliveryDate = minDate.toLocaleDateString();
          } else {
            isPastDate = true;
            deliveryDate = 'Delivery date in the past - not available';
          }
        } else {
          if (minDate >= currentDate || maxDate >= currentDate) {
            deliveryDate = `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
          } else {
            isPastDate = true;
            deliveryDate = 'Delivery date in the past - not available';
          }
        }
      } else if (property.min_delivery_date) {
        const minDate = new Date(property.min_delivery_date);
        if (minDate >= currentDate) {
          deliveryDate = minDate.toLocaleDateString();
        } else {
          isPastDate = true;
          deliveryDate = 'Delivery date in the past - not available';
        }
      } else if (property.max_delivery_date) {
        const maxDate = new Date(property.max_delivery_date);
        if (maxDate >= currentDate) {
          deliveryDate = maxDate.toLocaleDateString();
        } else {
          isPastDate = true;
          deliveryDate = 'Delivery date in the past - not available';
        }
      } else {
        deliveryDate = 'Ready for immediate delivery';
      }
      
      // Skip properties with past delivery dates
      if (isPastDate) {
        return null;
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

      return `${index + 1}. PRIMARY UNIT - ${property.property_type_name || ''} (Developer Sale)
  - Price: ${price}
  - Area: ${area}
  - Bedrooms: ${bedrooms} | Bathrooms: ${bathrooms}
  - Finishing: ${finishing}
  - Delivery: ${deliveryDate}
  - Financing: ${financing}
  - Project: ${property.project_name} by ${property.project_developer}`;
    }).filter(property => property !== null); // Filter out null properties (past dates)

    if (validProperties.length === 0) {
      return 'No primary units with valid future delivery dates are currently available in this project. We only handle primary units (developer sales) and do not provide information about resale properties.';
    }

    return validProperties.join('\n\n');
  }

  formatPropertyTypes(propertyTypes) {
    if (!propertyTypes || propertyTypes.length === 0) {
      return 'No primary units available.';
    }

    // Filter to show only developer_sale properties
    const primaryPropertyTypes = propertyTypes.filter(pt => 
      pt.business_types && pt.business_types.includes('developer_sale')
    );

    if (primaryPropertyTypes.length === 0) {
      return 'No primary units available in this project.';
    }

    return primaryPropertyTypes.map(pt => {
      const priceRange = pt.price_range.min && pt.price_range.max 
        ? `EGP ${pt.price_range.min.toLocaleString()} - ${pt.price_range.max.toLocaleString()}`
        : 'Contact for pricing';
      
      const areaRange = pt.area_range.min && pt.area_range.max 
        ? `${pt.area_range.min}-${pt.area_range.max} sqm`
        : 'Various sizes';

      return `• PRIMARY UNIT - ${pt.name}
  - Properties Available: ${pt.properties_count}
  - Price Range: ${priceRange}
  - Size Range: ${areaRange}
  - Business Type: Developer Sale (Primary Unit)`;
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

  async makeProjectPrompt(projectName, campaignType) {
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
      }, null, false, projectName, true, campaignType);
      
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

    const prompt = `You are a real estate consultant specializing in PRIMARY UNITS (developer sales) for ${name} by ${developer_name} in ${area_name}.

    PHASE 1 RESPONSE RULES:
    1. Provide 2-3 sentence brief project overview for PRIMARY UNITS only
    2. Include project name, location, developer
    3. Mention available property types and unit counts (primary units only)
    4. NO detailed pricing or financing information
    5. NO specific property details
    6. Simple call-to-action asking what they need
    7. Keep responses concise and welcoming
    8. Emphasize that you're showing primary units from the developer
    
    PRIMARY UNITS FOCUS:
    - ONLY discuss developer sales (primary units)
    - NEVER mention resale properties or secondary market
    - Always clarify that you're showing primary units from the developer
    - Emphasize the benefits of buying directly from developers
    
    LANGUAGE ADAPTATION:
    - Mirror the client's language (Arabic/English/Mixed)
    - If they use Egyptian slang, respond naturally but keep it professional
    - OK: "ايوة، الشقة دي ممتازة" / "اه متاح تقسيط"
    - NOT OK: Being too casual or using street slang
    - Mix languages naturally if they do: "الproject ده في location ممتاز"
    
    EXAMPLE RESPONSE FORMAT:
    "[Project Name] by [Developer] in [Location] offers [property types] with [unit count] primary units available directly from the developer. [Brief location benefit]. What specific information are you looking for about these primary units?"
    
    CONVERSATION FLOW:
    - Brief overview → Ask what they need → Guide to detailed info
    - Don't over-explain or provide detailed pricing
    - Focus on welcoming and gathering their specific needs
    - Always emphasize primary units and developer benefits
    
    Remember: This is Phase 1 - keep it brief and welcoming. Focus on primary units only. Detailed information comes in follow-up questions.`;

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