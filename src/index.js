require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const chatRoutes = require('./routes/chatRoutes');
const datasetRoutes = require('./routes/datasetRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        success: false,
        error: 'Invalid JSON format',
        details: 'Please check your JSON syntax. Common issues: trailing commas, missing quotes, or invalid characters.',
        example: {
          "prompt": "your message here",
          "test": false,
          "projectName": "project name"
        }
      });
      throw new Error('Invalid JSON');
    }
  }
}));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/dataset', datasetRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'openai-api-service',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Invalid JSON') {
    // JSON error already handled
    return;
  }
  
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    type: 'server_error'
  });
});

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  logger.info(`Chat API available at /api/chat`);
  logger.info(`Dataset API available at /api/dataset`);
}); 