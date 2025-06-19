const logger = require('../utils/logger');

/**
 * Middleware to authenticate API requests using API key
 * Expects API key in the api-key header
 */
const apiKeyAuth = (req, res, next) => {
  try {
    const apiKey = req.headers['api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required',
        type: 'authentication_error'
      });
    }

    // Get the expected API key from environment variables
    const expectedApiKey = process.env.EXTERNAL_API_KEY;
    
    if (!expectedApiKey) {
      logger.error('EXTERNAL_API_KEY environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        type: 'server_error'
      });
    }

    if (apiKey !== expectedApiKey) {
      console.log(apiKey, expectedApiKey);
      logger.warn(`Invalid API key attempt from IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        type: 'authentication_error'
      });
    }

    // API key is valid, proceed to the next middleware
    logger.info(`Valid API key used from IP: ${req.ip}`);
    next();
  } catch (error) {
    logger.error('Error in API key authentication:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      type: 'server_error'
    });
  }
};

module.exports = apiKeyAuth; 