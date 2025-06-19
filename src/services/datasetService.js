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
      return {
        name: data.name?.trim(),
        developer_name: data.developer_name?.trim(),
        area_name: data.area_name?.trim(),
        min_price: this.parseNumber(data.min_price),
        max_price: this.parseNumber(data.max_price),
        min_area: this.parseNumber(data.min_area),
        max_area: this.parseNumber(data.max_area),
        min_bedrooms: this.parseNumber(data.min_bedrooms),
        max_bedrooms: this.parseNumber(data.max_bedrooms),
        min_bathrooms: this.parseNumber(data.min_bathrooms),
        max_bathrooms: this.parseNumber(data.max_bathrooms),
        business_type: data.business_type?.trim(),
        property_types_names: data.property_types_names?.trim(),
        finishing: data.finishing?.trim(),
        min_delivery_date: data.min_delivery_date?.trim(),
        max_delivery_date: data.max_delivery_date?.trim(),
        financing_eligibility: this.parseBoolean(data.financing_eligibility),
        min_installments: this.parseNumber(data.min_installments),
        max_installments: this.parseNumber(data.max_installments),
        min_down_payment: this.parseNumber(data.min_down_payment),
        max_down_payment: this.parseNumber(data.max_down_payment),
        bruchure: data.bruchure?.trim()
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

      return `• ${project.name} by ${project.developer_name} in ${project.area_name}
  - Price: ${priceRange}
  - Size: ${areaRange}
  - Bedrooms: ${bedroomRange}
  - Delivery: ${deliveryDate}
  - Financing: ${financing}`;
    }).join('\n\n');
  }
}

module.exports = new DatasetService(); 