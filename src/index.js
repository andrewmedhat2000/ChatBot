require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 