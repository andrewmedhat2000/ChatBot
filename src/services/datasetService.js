const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const logger = require('../utils/logger');

class DatasetService {
  constructor() {
    this.projects = [];
    this.loaded = false;
    this.datasetPath = process.env.PROJECT_DATASET_PATH || './data/projects.csv';
  }

  async loadDataset() {
    try {
      if (this.loaded) {
        return { success: true, message: 'Dataset already loaded', count: this.projects.length };
      }

      if (!fs.existsSync(this.datasetPath)) {
        logger.warn(`Dataset file not found at: ${this.datasetPath}`);
        return { success: false, error: 'Dataset file not found' };
      }

      return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream(this.datasetPath)
          .pipe(csv())
          .on('data', (data) => {
            // Clean and parse the data
            const project = this.parseProjectData(data);
            if (project) {
              results.push(project);
            }
          })
          .on('end', () => {
            this.projects = results;
            this.loaded = true;
            logger.info(`Dataset loaded successfully with ${results.length} projects`);
            resolve({ 
              success: true, 
              message: 'Dataset loaded successfully', 
              count: results.length 
            });
          })
          .on('error', (error) => {
            logger.error('Error loading dataset:', error);
            reject({ success: false, error: error.message });
          });
      });
    } catch (error) {
      logger.error('Error in loadDataset:', error);
      return { success: false, error: error.message };
    }
  }

  parseProjectData(data) {
    try {
      // Extract all brochure URLs from the multiple bruchure columns
      const brochures = [];
      for (let i = 0; i < 38; i++) { // Based on the CSV structure, there are 38 brochure columns
        const brochureKey = `bruchure[${i}]`;
        if (data[brochureKey] && data[brochureKey].trim()) {
          brochures.push(data[brochureKey].trim());
        }
      }

      // Extract property types from count-based columns
      const propertyTypesNames = [];
      const propertyTypeFields = [
        'property_types_names.Villa',
        'property_types_names.Penthouse', 
        'property_types_names.Apartment',
        'property_types_names.Duplex',
        'property_types_names.Studio',
        'property_types_names.Townhouse',
        'property_types_names.Twinhouse',
        'property_types_names.Loft',
        'property_types_names.Office'
      ];
      
      propertyTypeFields.forEach(field => {
        const count = this.parseNumber(data[field]);
        if (count && count > 0) {
          const typeName = field.split('.')[1]; // Extract "Villa", "Apartment", etc.
          propertyTypesNames.push(typeName);
        }
      });

      // Extract business types from count-based columns
      const businessTypes = [];
      const businessTypeFields = [
        'business_types.developer_sale',
        'business_types.resale'
      ];
      
      businessTypeFields.forEach(field => {
        const count = this.parseNumber(data[field]);
        if (count && count > 0) {
          const typeName = field.split('.')[1]; // Extract "developer_sale", "resale"
          businessTypes.push(typeName);
        }
      });

      // Extract finishing options from count-based columns
      const finishingOptions = [];
      const finishingFields = [
        'finishing.not_finished',
        'finishing.finished',
        'finishing.semi_finished'
      ];
      
      finishingFields.forEach(field => {
        const count = this.parseNumber(data[field]);
        if (count && count > 0) {
          const optionName = field.split('.')[1]; // Extract "not_finished", "finished", etc.
          finishingOptions.push(optionName);
        }
      });

      // Extract property types array from flattened columns
      const propertyTypes = [];
      for (let i = 0; i < 8; i++) { // Based on the CSV structure, there are 8 property types
        const nameField = `property_types[${i}].name`;
        const idField = `property_types[${i}].property_type_id`;
        const countField = `property_types[${i}].property_types_count`;
        
        if (data[nameField] && data[nameField].trim()) {
          const propertyType = {
            property_type_id: this.parseNumber(data[idField]),
            name: data[nameField].trim(),
            property_types_count: this.parseNumber(data[countField]),
            properties: [] // We'll populate this with individual properties
          };

          // Extract individual properties for this property type
          const properties = [];
          for (let j = 0; j < 30; j++) { // Assume max 30 properties per type
            const propertyIdField = `property_types[${i}].properties[${j}].property_id`;
            const businessTypeField = `property_types[${i}].properties[${j}].business_type`;
            const priceField = `property_types[${i}].properties[${j}].price`;
            const minPriceField = `property_types[${i}].properties[${j}].min_price`;
            const maxPriceField = `property_types[${i}].properties[${j}].max_price`;
            const areaField = `property_types[${i}].properties[${j}].area`;
            const minAreaField = `property_types[${i}].properties[${j}].min_area`;
            const maxAreaField = `property_types[${i}].properties[${j}].max_area`;
            const minBedroomsField = `property_types[${i}].properties[${j}].min_bedrooms`;
            const maxBedroomsField = `property_types[${i}].properties[${j}].max_bedrooms`;
            const minBathroomsField = `property_types[${i}].properties[${j}].min_bathrooms`;
            const maxBathroomsField = `property_types[${i}].properties[${j}].max_bathrooms`;
            const finishingField = `property_types[${i}].properties[${j}].finishing`;
            const deliveryDateField = `property_types[${i}].properties[${j}].delivery_date`;
            const minDeliveryDateField = `property_types[${i}].properties[${j}].min_delivery_date`;
            const maxDeliveryDateField = `property_types[${i}].properties[${j}].max_delivery_date`;
            const financingField = `property_types[${i}].properties[${j}].financing_available`;
            const downPaymentField = `property_types[${i}].properties[${j}].down_payment`;
            const minDownPaymentField = `property_types[${i}].properties[${j}].min_down_payment`;
            const maxDownPaymentField = `property_types[${i}].properties[${j}].max_down_payment`;
            const installmentsField = `property_types[${i}].properties[${j}].installments`;
            const minInstallmentsField = `property_types[${i}].properties[${j}].min_installments`;
            const maxInstallmentsField = `property_types[${i}].properties[${j}].max_installments`;

            // Check if this property exists (has at least a property_id or business_type)
            if (data[propertyIdField] || data[businessTypeField]) {
              // Fallback logic for price and area
              const min_price = this.parseNumber(data[minPriceField]);
              const max_price = this.parseNumber(data[maxPriceField]);
              const min_area = this.parseNumber(data[minAreaField]);
              const max_area = this.parseNumber(data[maxAreaField]);
              const price = this.parseNumber(data[priceField]) ?? min_price ?? max_price;
              const area = this.parseNumber(data[areaField]) ?? min_area ?? max_area;

              const property = {
                property_id: data[propertyIdField] ? this.parseNumber(data[propertyIdField]) : null,
                business_type: data[businessTypeField]?.trim() || null,
                price,
                min_price,
                max_price,
                area,
                min_area,
                max_area,
                min_bedrooms: this.parseNumber(data[minBedroomsField]),
                max_bedrooms: this.parseNumber(data[maxBedroomsField]),
                min_bathrooms: this.parseNumber(data[minBathroomsField]),
                max_bathrooms: this.parseNumber(data[maxBathroomsField]),
                finishing: data[finishingField]?.trim() || null,
                delivery_date: data[deliveryDateField]?.trim() || null,
                min_delivery_date: data[minDeliveryDateField]?.trim() || null,
                max_delivery_date: data[maxDeliveryDateField]?.trim() || null,
                financing_available: this.parseBoolean(data[financingField]),
                down_payment: this.parseNumber(data[downPaymentField]),
                min_down_payment: this.parseNumber(data[minDownPaymentField]),
                max_down_payment: this.parseNumber(data[maxDownPaymentField]),
                installments: this.parseNumber(data[installmentsField]),
                min_installments: this.parseNumber(data[minInstallmentsField]),
                max_installments: this.parseNumber(data[maxInstallmentsField])
              };

              // Only add property if it has meaningful data
              if (property.business_type || property.price || property.area) {
                properties.push(property);
              }
            }
          }

          propertyType.properties = properties;
          propertyTypes.push(propertyType);
        }
      }

      // Handle MongoDB document structure with rich attributes
      return {
        _id: data._id,
        name: data.name?.trim(),
        area_id: data.area_id,
        developer_id: data.developer_id,
        inventory_public: this.parseBoolean(data.inventory_public),
        on_hold: this.parseBoolean(data.on_hold),
        last_update: data.last_update,
        developer_name: data.developer_name?.trim(),
        area_name: data.area_name?.trim(),
        min_price: this.parseNumber(data.min_price),
        max_price: this.parseNumber(data.max_price),
        min_area: this.parseNumber(data.min_area),
        max_area: this.parseNumber(data.max_area),
        min_land_area: this.parseNumber(data.min_land_area),
        max_land_area: this.parseNumber(data.max_land_area),
        min_garden_area: this.parseNumber(data.min_garden_area),
        max_garden_area: this.parseNumber(data.max_garden_area),
        min_bedrooms: this.parseNumber(data.min_bedrooms),
        max_bedrooms: this.parseNumber(data.max_bedrooms),
        min_bathrooms: this.parseNumber(data.min_bathrooms),
        max_bathrooms: this.parseNumber(data.max_bathrooms),
        business_type: data.business_type?.trim(),
        property_types_names: propertyTypesNames.length > 0 ? propertyTypesNames.join(', ') : undefined,
        business_types: businessTypes.length > 0 ? businessTypes : undefined,
        finishing: finishingOptions.length > 0 ? finishingOptions : undefined,
        min_delivery_date: data.min_delivery_date?.trim(),
        max_delivery_date: data.max_delivery_date?.trim(),
        financing_eligibility: this.parseBoolean(data.financing_eligibility),
        min_installments: this.parseNumber(data.min_installments),
        max_installments: this.parseNumber(data.max_installments),
        min_down_payment: this.parseNumber(data.min_down_payment),
        max_down_payment: this.parseNumber(data.max_down_payment),
        brochures: brochures, // Store all brochure URLs as an array
        property_types: propertyTypes.length > 0 ? propertyTypes : undefined, // Store the full property_types array with individual properties
        last_scraped: data.last_scraped,
        s3_upload_date: data.s3_upload_date,
        compounds_scraped: this.parseBoolean(data.compounds_scraped),
        properties_scraped: this.parseBoolean(data.properties_scraped)
      };
    } catch (error) {
      logger.error('Error parsing project data:', error);
      return null;
    }
  }

  parseNumber(value) {
    if (!value || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  parseBoolean(value) {
    if (!value || value === '') return false;
    return value.toLowerCase() === 'true' || value === '1';
  }

  async searchProjects(query = '', filters = {}) {
    try {
      if (!this.loaded) {
        await this.loadDataset();
      }

      let filteredProjects = [...this.projects];

      // Text search
      if (query) {
        const searchTerm = query.toLowerCase();
        filteredProjects = filteredProjects.filter(project => 
          project.name?.toLowerCase().includes(searchTerm) ||
          project.developer_name?.toLowerCase().includes(searchTerm) ||
          project.area_name?.toLowerCase().includes(searchTerm) ||
          project.business_type?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply filters
      if (filters.price_min !== undefined) {
        filteredProjects = filteredProjects.filter(project => 
          project.min_price && project.min_price >= filters.price_min
        );
      }

      if (filters.price_max !== undefined) {
        filteredProjects = filteredProjects.filter(project => 
          project.max_price && project.max_price <= filters.price_max
        );
      }

      if (filters.bedrooms !== undefined) {
        filteredProjects = filteredProjects.filter(project => 
          project.min_bedrooms && project.min_bedrooms <= filters.bedrooms &&
          project.max_bedrooms && project.max_bedrooms >= filters.bedrooms
        );
      }

      if (filters.area_name) {
        filteredProjects = filteredProjects.filter(project => 
          project.area_name?.toLowerCase().includes(filters.area_name.toLowerCase())
        );
      }

      if (filters.developer_name) {
        filteredProjects = filteredProjects.filter(project => 
          project.developer_name?.toLowerCase().includes(filters.developer_name.toLowerCase())
        );
      }

      if (filters.financing_eligibility !== undefined) {
        filteredProjects = filteredProjects.filter(project => 
          project.financing_eligibility === filters.financing_eligibility
        );
      }

      return {
        success: true,
        projects: filteredProjects,
        count: filteredProjects.length,
        total: this.projects.length
      };
    } catch (error) {
      logger.error('Error in searchProjects:', error);
      return { success: false, error: error.message };
    }
  }

  async getProjectByName(projectName) {
    try {
      if (!this.loaded) {
        await this.loadDataset();
      }

      const project = this.projects.find(p => 
        p.name?.toLowerCase() === projectName.toLowerCase()
      );

      console.log('project', project);

      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      return { success: true, project };
    } catch (error) {
      logger.error('Error in getProjectByName:', error);
      return { success: false, error: error.message };
    }
  }

  async getSimilarProjects(projectName, limit = 3) {
    try {
      if (!this.loaded) {
        await this.loadDataset();
      }

      const targetProject = this.projects.find(p => 
        p.name?.toLowerCase() === projectName.toLowerCase()
      );

      if (!targetProject) {
        return { success: false, error: 'Project not found' };
      }

      const similarProjects = this.projects
        .filter(p => p.name !== targetProject.name)
        .map(project => ({
          project,
          score: this.calculateSimilarityScore(targetProject, project)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.project);

      return { success: true, projects: similarProjects };
    } catch (error) {
      logger.error('Error in getSimilarProjects:', error);
      return { success: false, error: error.message };
    }
  }

  calculateSimilarityScore(project1, project2) {
    let score = 0;

    // Price similarity (30% weight)
    if (project1.min_price && project2.min_price) {
      const priceDiff = Math.abs(project1.min_price - project2.min_price) / project1.min_price;
      if (priceDiff <= 0.3) {
        score += 30 * (1 - priceDiff);
      }
    }

    // Area similarity (25% weight)
    if (project1.min_area && project2.min_area) {
      const areaDiff = Math.abs(project1.min_area - project2.min_area) / project1.min_area;
      if (areaDiff <= 0.5) {
        score += 25 * (1 - areaDiff);
      }
    }

    // Location similarity (25% weight)
    if (project1.area_name === project2.area_name) {
      score += 25;
    }

    // Developer similarity (20% weight)
    if (project1.developer_name === project2.developer_name) {
      score += 20;
    }

    return score;
  }

  async compareProjects(projectNames) {
    try {
      if (!this.loaded) {
        await this.loadDataset();
      }

      const projects = [];
      for (const name of projectNames) {
        const result = await this.getProjectByName(name);
        if (result.success) {
          projects.push(result.project);
        }
      }

      if (projects.length === 0) {
        return { success: false, error: 'No valid projects found' };
      }

      return { success: true, projects };
    } catch (error) {
      logger.error('Error in compareProjects:', error);
      return { success: false, error: error.message };
    }
  }

  async getMarketInsights() {
    try {
      if (!this.loaded) {
        await this.loadDataset();
      }

      if (this.projects.length === 0) {
        return { success: false, error: 'No projects available' };
      }

      const prices = this.projects
        .filter(p => p.min_price && p.max_price)
        .map(p => (p.min_price + p.max_price) / 2);

      const areas = [...new Set(this.projects.map(p => p.area_name).filter(Boolean))];
      const developers = [...new Set(this.projects.map(p => p.developer_name).filter(Boolean))];
      const financingAvailable = this.projects.filter(p => p.financing_eligibility).length;

      const insights = {
        totalProjects: this.projects.length,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: prices.reduce((a, b) => a + b, 0) / prices.length
        },
        areas,
        developers,
        financingAvailable,
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length
      };

      return { success: true, insights };
    } catch (error) {
      logger.error('Error in getMarketInsights:', error);
      return { success: false, error: error.message };
    }
  }

  async getDatasetStatus() {
    try {
      const status = {
        loaded: this.loaded,
        count: this.projects.length,
        datasetPath: this.datasetPath,
        fileExists: fs.existsSync(this.datasetPath)
      };

      if (this.loaded) {
        status.message = 'Dataset already loaded';
      } else if (status.fileExists) {
        status.message = 'Dataset file exists but not loaded';
      } else {
        status.message = 'Dataset file not found';
      }

      return { success: true, ...status };
    } catch (error) {
      logger.error('Error in getDatasetStatus:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllProjects() {
    try {
      if (!this.loaded) {
        await this.loadDataset();
      }

      return {
        success: true,
        projects: this.projects,
        count: this.projects.length
      };
    } catch (error) {
      logger.error('Error in getAllProjects:', error);
      return { success: false, error: error.message };
    }
  }

  formatProjectsForPrompt(projects) {
    if (!projects || projects.length === 0) {
      return 'No projects available.';
    }

    return projects.map(project => {
      const priceRange = project.min_price && project.max_price 
        ? `EGP ${project.min_price.toLocaleString()} - ${project.max_price.toLocaleString()}`
        : 'Contact for pricing';
      
      const areaRange = project.min_area && project.max_area 
        ? `${project.min_area}-${project.max_area} sqm`
        : 'Contact for details';
      
      const bedroomRange = project.min_bedrooms && project.max_bedrooms 
        ? `${project.min_bedrooms}-${project.max_bedrooms}`
        : 'Contact for details';

      const deliveryDate = project.min_delivery_date 
        ? new Date(project.min_delivery_date).toLocaleDateString()
        : 'Contact for details';

      const financing = project.financing_eligibility 
        ? `Yes (${project.min_down_payment}%-${project.max_down_payment}% down)`
        : 'No';

      const brochureInfo = project.brochures && project.brochures.length > 0
        ? `\n  - Brochures: ${project.brochures.length} available (S3 URLs: ${project.brochures.join(', ')})`
        : '\n  - Brochures: Not available';

      return `• ${project.name} by ${project.developer_name} in ${project.area_name}
  - Price: ${priceRange}
  - Size: ${areaRange}
  - Bedrooms: ${bedroomRange}
  - Delivery: ${deliveryDate}
  - Financing: ${financing}${brochureInfo}`;
    }).join('\n\n');
  }

  async getProperties(projectName = null, propertyType = null, businessType = null, filters = {}) {
    try {
      if (!this.loaded) {
        await this.loadDataset();
      }

      let allProperties = [];

      // If project name is specified, get properties from that project only
      if (projectName) {
        const projectResult = await this.getProjectByName(projectName);
        if (!projectResult.success) {
          return { success: false, error: `Project '${projectName}' not found` };
        }

        const project = projectResult.project;
        
        // Check if project has rich property_types array structure
        if (project.property_types && Array.isArray(project.property_types)) {
          // Use the rich property_types array structure
          project.property_types.forEach(pt => {
            if (pt.properties && Array.isArray(pt.properties)) {
              pt.properties.forEach(property => {
                allProperties.push({
                  ...property,
                  project_name: project.name,
                  project_developer: project.developer_name,
                  project_area: project.area_name,
                  property_type_name: pt.name
                });
              });
            }
          });
        } else {
          // Fallback to flat structure (CSV-like)
          const property = {
            business_type: project.business_type,
            price: project.min_price,
            area: project.min_area,
            bedrooms: project.min_bedrooms,
            bathrooms: project.min_bathrooms,
            finishing: project.finishing,
            delivery_date: project.min_delivery_date,
            financing_available: project.financing_eligibility,
            down_payment: project.min_down_payment,
            installments: project.min_installments,
            project_name: project.name,
            project_developer: project.developer_name,
            project_area: project.area_name,
            property_type_name: project.property_types_names || 'Unknown'
          };

          allProperties.push(property);
        }
      } else {
        // Get properties from all projects
        this.projects.forEach(project => {
          if (project.property_types && Array.isArray(project.property_types)) {
            // Use the rich property_types array structure
            project.property_types.forEach(pt => {
              if (pt.properties && Array.isArray(pt.properties)) {
                pt.properties.forEach(property => {
                  allProperties.push({
                    ...property,
                    project_name: project.name,
                    project_developer: project.developer_name,
                    project_area: project.area_name,
                    property_type_name: pt.name
                  });
                });
              }
            });
          } else {
            // Fallback to flat structure (CSV-like)
            const property = {
              business_type: project.business_type,
              price: project.min_price,
              area: project.min_area,
              bedrooms: project.min_bedrooms,
              bathrooms: project.min_bathrooms,
              finishing: project.finishing,
              delivery_date: project.min_delivery_date,
              financing_available: project.financing_eligibility,
              down_payment: project.min_down_payment,
              installments: project.min_installments,
              project_name: project.name,
              project_developer: project.developer_name,
              project_area: project.area_name,
              property_type_name: project.property_types_names || 'Unknown'
            };

            allProperties.push(property);
          }
        });
      }

      // Apply filters
      let filteredProperties = allProperties;

      // Filter by property type (handle undefined property_types_names)
      if (propertyType) {
        filteredProperties = filteredProperties.filter(property => {
          // If property_type_name is undefined or "Unknown", try to infer from other data
          if (!property.property_type_name || property.property_type_name === 'Unknown') {
            // For now, we'll include all properties when property type is undefined
            // This is a limitation of the current data structure
            return true;
          }
          return property.property_type_name.toLowerCase().includes(propertyType.toLowerCase());
        });
      }

      // Filter by business type
      if (businessType) {
        filteredProperties = filteredProperties.filter(property => 
          property.business_type?.toLowerCase() === businessType.toLowerCase()
        );
      }

      // Filter out properties with delivery dates in the past
      const currentDate = new Date();
      filteredProperties = filteredProperties.filter(property => {
        // If no delivery dates at all, include the property (it might be ready or TBD)
        if (!property.min_delivery_date && !property.max_delivery_date) {
          return true;
        }
        
        // Check if either min_delivery_date or max_delivery_date is in the future
        const minDeliveryDate = property.min_delivery_date ? new Date(property.min_delivery_date) : null;
        const maxDeliveryDate = property.max_delivery_date ? new Date(property.max_delivery_date) : null;
        
        // Include if:
        // 1. min_delivery_date exists and is in the future, OR
        // 2. max_delivery_date exists and is in the future, OR
        // 3. Both dates exist and at least one is in the future
        if (minDeliveryDate && minDeliveryDate >= currentDate) {
          return true;
        }
        if (maxDeliveryDate && maxDeliveryDate >= currentDate) {
          return true;
        }
        
        // If both dates are in the past, exclude the property
        return false;
      });

      // Apply additional filters
      if (filters.price_min !== undefined) {
        filteredProperties = filteredProperties.filter(property => 
          property.price && property.price >= filters.price_min
        );
      }

      if (filters.price_max !== undefined) {
        filteredProperties = filteredProperties.filter(property => 
          property.price && property.price <= filters.price_max
        );
      }

      if (filters.bedrooms !== undefined) {
        filteredProperties = filteredProperties.filter(property => 
          property.bedrooms && property.bedrooms === filters.bedrooms
        );
      }

      if (filters.area_min !== undefined) {
        filteredProperties = filteredProperties.filter(property => 
          property.area && property.area >= filters.area_min
        );
      }

      if (filters.area_max !== undefined) {
        filteredProperties = filteredProperties.filter(property => 
          property.area && property.area <= filters.area_max
        );
      }

      if (filters.finishing) {
        filteredProperties = filteredProperties.filter(property => 
          property.finishing?.toLowerCase().includes(filters.finishing.toLowerCase())
        );
      }

      if (filters.financing_available !== undefined) {
        filteredProperties = filteredProperties.filter(property => 
          property.financing_available === filters.financing_available
        );
      }

      return {
        success: true,
        properties: filteredProperties,
        count: filteredProperties.length,
        total: allProperties.length
      };
    } catch (error) {
      logger.error('Error in getProperties:', error);
      return { success: false, error: error.message };
    }
  }

  async getPropertyTypes(projectName) {
    try {
      if (!this.loaded) {
        await this.loadDataset();
      }

      const projectResult = await this.getProjectByName(projectName);
      if (!projectResult.success) {
        return { success: false, error: `Project '${projectName}' not found` };
      }

      const project = projectResult.project;
      const propertyTypes = [];

      // Check if project has rich property_types array structure
      if (project.property_types && Array.isArray(project.property_types)) {
        // Use the rich property_types array structure
        project.property_types.forEach(pt => {
          if (pt.name) {
            const propertyType = {
              name: pt.name,
              properties_count: pt.properties ? pt.properties.length : 0,
              business_types: [],
              price_range: { min: null, max: null },
              area_range: { min: null, max: null }
            };

            // Extract business types and calculate ranges
            if (pt.properties && Array.isArray(pt.properties)) {
              const prices = [];
              const areas = [];
              const businessTypes = new Set();

              pt.properties.forEach(property => {
                if (property.business_type) {
                  businessTypes.add(property.business_type);
                }
                if (property.price) {
                  prices.push(property.price);
                }
                if (property.area) {
                  areas.push(property.area);
                }
              });

              propertyType.business_types = Array.from(businessTypes);
              if (prices.length > 0) {
                propertyType.price_range = {
                  min: Math.min(...prices),
                  max: Math.max(...prices)
                };
              }
              if (areas.length > 0) {
                propertyType.area_range = {
                  min: Math.min(...areas),
                  max: Math.max(...areas)
                };
              }
            }

            propertyTypes.push(propertyType);
          }
        });
      } else {
        // Fallback to flat structure (CSV-like)
        // Since CSV data is flat, we need to create property types from the available data
        // For now, we'll create a single property type based on the project's property_types_names
        if (project.property_types_names) {
          const propertyType = {
            name: project.property_types_names,
            properties_count: 1, // Each project row represents one property
            business_types: project.business_type ? [project.business_type] : [],
            price_range: {
              min: project.min_price,
              max: project.max_price
            },
            area_range: {
              min: project.min_area,
              max: project.max_area
            }
          };

          propertyTypes.push(propertyType);
        }
      }

      return {
        success: true,
        propertyTypes,
        count: propertyTypes.length
      };
    } catch (error) {
      logger.error('Error in getPropertyTypes:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DatasetService(); 