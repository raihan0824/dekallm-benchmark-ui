// Production server entry point
import express from 'express';
import { registerRoutes } from './routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { serveStatic } from './vite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // In production, we serve the static files directly
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Register API routes
  await registerRoutes(app);
  
  // Serve HTML for any other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  // Start the server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Production server running on port ${PORT}`);
  });
}

startServer().catch(console.error);