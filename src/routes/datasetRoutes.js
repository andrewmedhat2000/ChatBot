const express = require('express');
const { body, validationResult } = require('express-validator');
const datasetService = require('../services/datasetService');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateSearchRequest = [
  body('query').optional().isString().withMessage('Query must be a string'),
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('filters.price_min').optional().isNumeric().withMessage('Price min must be a number'),
  body('filters.price_max').optional().isNumeric().withMessage('Price max must be a number'),
  body('filters.bedrooms').optional().isInt({ min: 1 }).withMessage('Bedrooms must be a positive integer'),
  body('filters.area_name').optional().isString().withMessage('Area name must be a string'),
  body('filters.developer_name').optional().isString().withMessage('Developer name must be a string'),
  body('filters.financing_eligibility').optional().isBoolean().withMessage('Financing eligibility must be a boolean'),
  body('campaignType').optional().isIn(['Primary', 'Resale']).withMessage('Campaign type must be one of: Primary, Resale')
];

const validateProjectRequest = [
  body('projectName').notEmpty().isString().withMessage('Project name is required and must be a string'),
  body('campaignType').optional().isIn(['Primary', 'Resale']).withMessage('Campaign type must be one of: Primary, Resale')
];

const validateSimilarRequest = [
  body('projectName').notEmpty().isString().withMessage('Project name is required and must be a string'),
  body('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10'),
  body('campaignType').optional().isIn(['Primary', 'Resale']).withMessage('Campaign type must be one of: Primary, Resale')
];

const validateCompareRequest = [
  body('projectNames').isArray({ min: 2, max: 5 }).withMessage('Project names must be an array with 2-5 items'),
  body('projectNames.*').isString().withMessage('Each project name must be a string'),
  body('campaignType').optional().isIn(['Primary', 'Resale']).withMessage('Campaign type must be one of: Primary, Resale')
];

// Search projects endpoint
router.post('/search', apiKeyAuth, validateSearchRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { query, filters, campaignType = 'Primary' } = req.body;
    
    logger.info(`Dataset search request: query="${query}", filters=`, filters, `campaignType="${campaignType}"`);
    
    const result = await datasetService.searchProjects(query, filters, campaignType);

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      projects: result.projects,
      count: result.count,
      total: result.total
    });
  } catch (error) {
    logger.error('Error in dataset search route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Get project details endpoint
router.post('/project', apiKeyAuth, validateProjectRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { projectName, campaignType = 'Primary' } = req.body;
    
    logger.info(`Dataset project request: projectName="${projectName}", campaignType="${campaignType}"`);
    
    const result = await datasetService.getProjectByName(projectName, campaignType);

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      project: result.project
    });
  } catch (error) {
    logger.error('Error in dataset project route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Get similar projects endpoint
router.post('/similar', apiKeyAuth, validateSimilarRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { projectName, limit = 3, campaignType = 'Primary' } = req.body;
    
    logger.info(`Dataset similar request: projectName="${projectName}", limit=${limit}, campaignType="${campaignType}"`);
    
    const result = await datasetService.getSimilarProjects(projectName, limit, campaignType);

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      projects: result.projects
    });
  } catch (error) {
    logger.error('Error in dataset similar route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Compare projects endpoint
router.post('/compare', apiKeyAuth, validateCompareRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { projectNames, campaignType = 'Primary' } = req.body;
    
    logger.info(`Dataset compare request: projectNames=`, projectNames, `campaignType="${campaignType}"`);
    
    const result = await datasetService.compareProjects(projectNames, campaignType);

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      projects: result.projects
    });
  } catch (error) {
    logger.error('Error in dataset compare route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Get market insights endpoint
router.get('/insights', apiKeyAuth, async (req, res) => {
  try {
    logger.info('Dataset insights request');
    
    const result = await datasetService.getMarketInsights();

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      insights: result.insights
    });
  } catch (error) {
    logger.error('Error in dataset insights route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Get dataset status endpoint
router.get('/status', apiKeyAuth, async (req, res) => {
  try {
    logger.info('Dataset status request');
    
    const result = await datasetService.getDatasetStatus();

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      status: result.status
    });
  } catch (error) {
    logger.error('Error in dataset status route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Load dataset endpoint
router.post('/load', apiKeyAuth, [
  body('campaignType').optional().isIn(['Primary', 'Resale']).withMessage('Campaign type must be one of: Primary, Resale')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { campaignType = 'Primary' } = req.body;
    
    logger.info(`Dataset load request: campaignType="${campaignType}"`);
    
    const result = await datasetService.loadDataset(campaignType);

    if (!result.success) {
      return res.status(500).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message,
      count: result.count,
      campaignType: result.campaignType
    });
  } catch (error) {
    logger.error('Error in dataset load route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Get all projects endpoint
router.get('/all', apiKeyAuth, async (req, res) => {
  try {
    logger.info('Dataset all projects request');
    
    const result = await datasetService.getAllProjects();

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      projects: result.projects,
      count: result.count
    });
  } catch (error) {
    logger.error('Error in dataset all projects route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Get properties endpoint with hierarchical filtering
router.post('/properties', apiKeyAuth, [
  body('projectName').optional().isString().withMessage('Project name must be a string'),
  body('propertyType').optional().isString().withMessage('Property type must be a string'),
  body('businessType').optional().isIn(['primary', 'resale']).withMessage('Business type must be either primary or resale'),
  body('campaignType').optional().isIn(['Primary', 'Resale']).withMessage('Campaign type must be one of: Primary, Resale'),
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('filters.price_min').optional().isNumeric().withMessage('Price min must be a number'),
  body('filters.price_max').optional().isNumeric().withMessage('Price max must be a number'),
  body('filters.bedrooms').optional().isInt({ min: 1 }).withMessage('Bedrooms must be a positive integer'),
  body('filters.area_min').optional().isNumeric().withMessage('Area min must be a number'),
  body('filters.area_max').optional().isNumeric().withMessage('Area max must be a number'),
  body('filters.finishing').optional().isString().withMessage('Finishing must be a string'),
  body('filters.financing_available').optional().isBoolean().withMessage('Financing available must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { projectName, propertyType, businessType, campaignType = 'Primary', filters = {} } = req.body;
    
    logger.info(`Properties request: projectName="${projectName}", propertyType="${propertyType}", businessType="${businessType}", campaignType="${campaignType}", filters=`, filters);
    
    const result = await datasetService.getProperties(projectName, propertyType, businessType, filters, campaignType);

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      properties: result.properties,
      count: result.count,
      total: result.total,
      filters: {
        projectName,
        propertyType,
        businessType,
        campaignType,
        ...filters
      }
    });
  } catch (error) {
    logger.error('Error in properties route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

// Get property types for a project endpoint
router.post('/property-types', apiKeyAuth, [
  body('projectName').notEmpty().isString().withMessage('Project name is required and must be a string'),
  body('campaignType').optional().isIn(['Primary', 'Resale']).withMessage('Campaign type must be one of: Primary, Resale')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { projectName, campaignType = 'Primary' } = req.body;
    
    logger.info(`Property types request: projectName="${projectName}", campaignType="${campaignType}"`);
    
    const result = await datasetService.getPropertyTypes(projectName, campaignType);

    if (!result.success) {
      return res.status(404).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      propertyTypes: result.propertyTypes,
      count: result.count,
      campaignType: result.campaignType
    });
  } catch (error) {
    logger.error('Error in property types route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

module.exports = router; 