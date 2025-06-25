const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const logger = require('../utils/logger');

class DatasetService {
  constructor() {
    this.projects = [];
    this.primaryProjects = [];
    this.resaleProjects = [];
    this.loaded = false;
    this.primaryLoaded = false;
    this.resaleLoaded = false;
    this.datasetPath = process.env.PROJECT_DATASET_PATH || './data/projects.csv';
    this.primaryDatasetPath = process.env.PRIMARY_DATASET_PATH || './data/primary_properties.csv';
    this.resaleDatasetPath = process.env.RESALE_DATASET_PATH || './data/resale_properties.csv';
  }

  async loadDataset(campaignType = 'Primary') {
    try {
      // If campaign type is specified, load the appropriate dataset
      if (campaignType === 'Primary' || campaignType === 'primary' || campaignType === 'developer_sale') {
        return await this.loadPrimaryDataset();
      } else if (campaignType === 'Resale' || campaignType === 'resale' || campaignType === 'secondary') {
        return await this.loadResaleDataset();
      } else {
        // Default to loading the combined dataset
        return await this.loadCombinedDataset();
      }
    } catch (error) {
      logger.error('Error in loadDataset:', error);
      return { success: false, error: error.message };
    }
  }

  async loadPrimaryDataset() {
    try {
      if (this.primaryLoaded) {
        return { success: true, message: 'Primary dataset already loaded', count: this.primaryProjects.length };
      }

      // Check if primary dataset file exists, if not create it from the main dataset
      if (!fs.existsSync(this.primaryDatasetPath)) {
        await this.createSeparateDatasets();
      }

      if (!fs.existsSync(this.primaryDatasetPath)) {
        logger.warn(`Primary dataset file not found at: ${this.primaryDatasetPath}`);
        return { success: false, error: 'Primary dataset file not found' };
      }

      return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream(this.primaryDatasetPath)
          .pipe(csv())
          .on('data', (data) => {
            const project = this.parseProjectData(data);
            if (project) {
              results.push(project);
            }
          })
          .on('end', () => {
            this.primaryProjects = results;
            this.projects = results; // Set current projects to primary
            this.primaryLoaded = true;
            logger.info(`Primary dataset loaded successfully with ${results.length} projects`);
            resolve({ 
              success: true, 
              message: 'Primary dataset loaded successfully', 
              count: results.length,
              campaignType: 'Primary'
            });
          })
          .on('error', (error) => {
            logger.error('Error loading primary dataset:', error);
            reject({ success: false, error: error.message });
          });
      });
    } catch (error) {
      logger.error('Error in loadPrimaryDataset:', error);
      return { success: false, error: error.message };
    }
  }

  async loadResaleDataset() {
    try {
      if (this.resaleLoaded) {
        return { success: true, message: 'Resale dataset already loaded', count: this.resaleProjects.length };
      }

      // Check if resale dataset file exists, if not create it from the main dataset
      if (!fs.existsSync(this.resaleDatasetPath)) {
        await this.createSeparateDatasets();
      }

      if (!fs.existsSync(this.resaleDatasetPath)) {
        logger.warn(`Resale dataset file not found at: ${this.resaleDatasetPath}`);
        return { success: false, error: 'Resale dataset file not found' };
      }

      return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream(this.resaleDatasetPath)
          .pipe(csv())
          .on('data', (data) => {
            const project = this.parseProjectData(data);
            if (project) {
              results.push(project);
            }
          })
          .on('end', () => {
            this.resaleProjects = results;
            this.projects = results; // Set current projects to resale
            this.resaleLoaded = true;
            logger.info(`Resale dataset loaded successfully with ${results.length} projects`);
            resolve({ 
              success: true, 
              message: 'Resale dataset loaded successfully', 
              count: results.length,
              campaignType: 'Resale'
            });
          })
          .on('error', (error) => {
            logger.error('Error loading resale dataset:', error);
            reject({ success: false, error: error.message });
          });
      });
    } catch (error) {
      logger.error('Error in loadResaleDataset:', error);
      return { success: false, error: error.message };
    }
  }

  async loadCombinedDataset() {
    try {
      if (this.loaded) {
        return { success: true, message: 'Combined dataset already loaded', count: this.projects.length };
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
            const project = this.parseProjectData(data);
            if (project) {
              results.push(project);
            }
          })
          .on('end', () => {
            this.projects = results;
            this.loaded = true;
            logger.info(`Combined dataset loaded successfully with ${results.length} projects`);
            resolve({ 
              success: true, 
              message: 'Combined dataset loaded successfully', 
              count: results.length,
              campaignType: 'Combined'
            });
          })
          .on('error', (error) => {
            logger.error('Error loading combined dataset:', error);
            reject({ success: false, error: error.message });
          });
      });
    } catch (error) {
      logger.error('Error in loadCombinedDataset:', error);
      return { success: false, error: error.message };
    }
  }

  async createSeparateDatasets() {
    try {
      logger.info('Creating separate datasets for primary and resale properties...');
      
      if (!fs.existsSync(this.datasetPath)) {
        logger.error(`Main dataset file not found at: ${this.datasetPath}`);
        return { success: false, error: 'Main dataset file not found' };
      }

      const primaryData = [];
      const resaleData = [];
      let headerRow = null;

      return new Promise((resolve, reject) => {
        fs.createReadStream(this.datasetPath)
          .pipe(csv())
          .on('data', (data) => {
            if (!headerRow) {
              headerRow = Object.keys(data);
            }

            // Create separate rows for each business type
            const primaryRow = this.createFilteredRow(data, 'developer_sale');
            const resaleRow = this.createFilteredRow(data, 'resale');

            if (primaryRow) {
              primaryData.push(primaryRow);
            }
            if (resaleRow) {
              resaleData.push(resaleRow);
            }
          })
          .on('end', async () => {
            try {
              // Write primary dataset
              await this.writeCSV(this.primaryDatasetPath, headerRow, primaryData);
              logger.info(`Primary dataset created with ${primaryData.length} projects`);

              // Write resale dataset
              await this.writeCSV(this.resaleDatasetPath, headerRow, resaleData);
              logger.info(`Resale dataset created with ${resaleData.length} projects`);

              resolve({ 
                success: true, 
                primaryCount: primaryData.length, 
                resaleCount: resaleData.length 
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            logger.error('Error creating separate datasets:', error);
            reject(error);
          });
      });
    } catch (error) {
      logger.error('Error in createSeparateDatasets:', error);
      return { success: false, error: error.message };
    }
  }

  createFilteredRow(data, businessType) {
    // Check if this project has any properties of the specified business type
    const hasBusinessType = this.hasBusinessType(data, businessType);
    
    if (!hasBusinessType) {
      return null; // Don't include this project for this business type
    }

    // Create a copy of the data row
    const filteredRow = { ...data };

    // Update business type counts to only include the specified type
    if (businessType === 'developer_sale') {
      filteredRow['business_types.developer_sale'] = data['business_types.developer_sale'] || '0';
      filteredRow['business_types.resale'] = '0'; // Set resale count to 0
    } else if (businessType === 'resale') {
      filteredRow['business_types.developer_sale'] = '0'; // Set developer_sale count to 0
      filteredRow['business_types.resale'] = data['business_types.resale'] || '0';
    }

    // Filter individual properties to only include the specified business type
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 30; j++) {
        const businessTypeField = `property_types[${i}].properties[${j}].business_type`;
        const currentBusinessType = data[businessTypeField]?.trim();
        
        if (currentBusinessType && currentBusinessType !== businessType) {
          // Clear properties that don't match the business type
          this.clearPropertyFields(filteredRow, i, j);
        }
      }
    }

    // Update property type counts to reflect only the filtered properties
    this.updatePropertyTypeCounts(filteredRow, businessType);

    return filteredRow;
  }

  clearPropertyFields(row, propertyTypeIndex, propertyIndex) {
    // Clear all property-related fields for the specified property
    const propertyFields = [
      'property_id', 'business_type', 'price', 'min_price', 'max_price',
      'area', 'min_area', 'max_area', 'min_bedrooms', 'max_bedrooms',
      'min_bathrooms', 'max_bathrooms', 'finishing', 'delivery_date',
      'min_delivery_date', 'max_delivery_date', 'financing_available',
      'down_payment', 'min_down_payment', 'max_down_payment',
      'installments', 'min_installments', 'max_installments'
    ];

    propertyFields.forEach(field => {
      const fieldName = `property_types[${propertyTypeIndex}].properties[${propertyIndex}].${field}`;
      row[fieldName] = '';
    });
  }

  updatePropertyTypeCounts(row, businessType) {
    // Update property type counts to reflect only the filtered properties
    for (let i = 0; i < 8; i++) {
      const countField = `property_types[${i}].property_types_count`;
      let validPropertyCount = 0;

      // Count properties that match the business type
      for (let j = 0; j < 30; j++) {
        const businessTypeField = `property_types[${i}].properties[${j}].business_type`;
        if (row[businessTypeField] && row[businessTypeField].trim() === businessType) {
          validPropertyCount++;
        }
      }

      // Update the count field
      if (row[countField]) {
        row[countField] = validPropertyCount.toString();
      }
    }
  }

  hasBusinessType(data, businessType) {
    // Check if the project has the specified business type
    const businessTypeFields = [
      'business_types.developer_sale',
      'business_types.resale'
    ];
    
    for (const field of businessTypeFields) {
      if (field.includes(businessType)) {
        const count = this.parseNumber(data[field]);
        if (count && count > 0) {
          return true;
        }
      }
    }

    // Also check individual properties
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 30; j++) {
        const businessTypeField = `property_types[${i}].properties[${j}].business_type`;
        if (data[businessTypeField] && data[businessTypeField].trim() == businessType) {
          return true;
        }
      }
    }

    return false;
  }

  async writeCSV(filePath, headers, data) {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      
      // Write header
      writeStream.write(headers.join(',') + '\n');
      
      // Write data rows
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        writeStream.write(values.join(',') + '\n');
      });
      
      writeStream.end();
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
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