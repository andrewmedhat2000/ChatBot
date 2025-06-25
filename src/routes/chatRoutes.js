const express = require('express');
const { body, validationResult } = require('express-validator');
const openaiService = require('../services/openaiService');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateChatRequest = [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('instructions').optional().isString().withMessage('Instructions must be a string'),
  body('options').optional().isObject().withMessage('Options must be an object'),
  body('options.temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('Temperature must be between 0 and 2'),
  body('options.max_tokens').optional().isInt({ min: 1, max: 4000 }).withMessage('Max tokens must be between 1 and 4000'),
  body('options.model').optional().isString().withMessage('Model must be a string'),
  body('lastResponseId').optional().custom((value) => {
    if (value !== null && typeof value !== 'string') {
      throw new Error('Last response ID must be a string or null');
    }
    return true;
  }).withMessage('Last response ID must be a string or null'),
  body('test').optional().isBoolean().withMessage('Test must be a boolean'),
  body('projectName').notEmpty().isString().withMessage('Project name is required and must be a string'),
  body('campaignType').notEmpty().isIn(['Primary', 'Resale']).withMessage('Campaign type must be one of: Primary, Resale')
];

// Chat completion endpoint with API key authentication
router.post('/completion', apiKeyAuth, validateChatRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { prompt, instructions, options, lastResponseId, test, projectName, campaignType = 'Primary' } = req.body;
    
    // Log the request for API usage
    logger.info(`API request from IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}, Test mode: ${test || false}, Project: ${projectName || 'none'}, Campaign Type: ${campaignType}`);
    
    const result = await openaiService.createChatCompletion(prompt, {
      ...options,
      instructions
    }, lastResponseId, test, projectName, false, campaignType);

    if (!result.success) {
      return res.status(500).json({ 
        success: false,
        error: result.error,
        type: result.type,
        code: result.code
      });
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error in chat completion route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      type: 'server_error'
    });
  }
});

module.exports = router; 