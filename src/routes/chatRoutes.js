const express = require('express');
const { body, validationResult } = require('express-validator');
const openaiService = require('../services/openaiService');
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
  body('lastResponseId').optional().isString().withMessage('Last response ID must be a string')
];


// Chat completion endpoint
router.post('/completion', validateChatRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { prompt, instructions, options, lastResponseId } = req.body;
    const result = await openaiService.createChatCompletion(prompt, {
      ...options,
      instructions
    }, lastResponseId);

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