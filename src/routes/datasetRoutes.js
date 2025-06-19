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
  body('filters.financing_eligibility').optional().isBoolean().withMessage('Financing eligibility must be a boolean')
];

const validateProjectRequest = [
  body('projectName').notEmpty().isString().withMessage('Project name is required and must be a string')
];

const validateSimilarRequest = [
  body('projectName').notEmpty().isString().withMessage('Project name is required and must be a string'),
  body('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
];

const validateCompareRequest = [
  body('projectNames').isArray({ min: 2, max: 5 }).withMessage('Project names must be an array with 2-5 items'),
  body('projectNames.*').isString().withMessage('Each project name must be a string')
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

    const { query, filters } = req.body;
    
    logger.info(`Dataset search request: query="${query}", filters=`, filters);
    
    const result = await datasetService.searchProjects(query, filters);

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

    const { projectName } = req.body;
    
    logger.info(`Dataset project request: projectName="${projectName}"`);
    
    const result = await datasetService.getProjectByName(projectName);

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

    const { projectName, limit = 3 } = req.body;
    
    logger.info(`Dataset similar request: projectName="${projectName}", limit=${limit}`);
    
    const result = await datasetService.getSimilarProjects(projectName, limit);

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

    const { projectNames } = req.body;
    
    logger.info(`Dataset compare request: projectNames=`, projectNames);
    
    const result = await datasetService.compareProjects(projectNames);

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
router.post('/load', apiKeyAuth, async (req, res) => {
  try {
    logger.info('Dataset load request');
    
    const result = await datasetService.loadDataset();

    if (!result.success) {
      return res.status(500).json({ 
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message,
      count: result.count
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

module.exports = router; 