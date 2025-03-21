// Simple production server
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registerRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simplify error handling for production
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Serve static files from the 'client/dist' directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// Register API routes
registerRoutes(app).then(httpServer => {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Production server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Add catch-all route last (after API routes are registered)
// All other routes serve the main index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});