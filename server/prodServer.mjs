// Simple production server
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { 
  express, 
  createServer,
  storage,
  benchmarkConfigSchema,
  benchmarkResultSchema,
  axios,
  ZodError,
  fromZodError
} from './esModuleShim.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simplify error handling for production
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Serve static files from multiple potential locations
// Try in the order of most likely locations first
app.use(express.static(path.join(__dirname, '../dist/public'))); // From vite.config.ts
app.use(express.static(path.join(__dirname, '../client/dist'))); // Common structure
app.use(express.static(path.join(__dirname, '../dist/client'))); // Alternative location
app.use(express.static(path.join(__dirname, '../dist'))); // Root dist folder

// Implement routes directly in the prodServer file
// Route to run a benchmark test
app.post("/api/benchmarks", async (req, res) => {
  try {
    // Validate request body
    const benchmarkConfig = benchmarkConfigSchema.parse(req.body);
    
    // Encode URL parameters
    const url = encodeURIComponent(benchmarkConfig.url);
    const benchmarkApiUrl = process.env.BENCHMARK_API_URL || 'http://localhost';
    const benchmarkUrl = `${benchmarkApiUrl}/run-load-test?user=${benchmarkConfig.user}&spawnrate=${benchmarkConfig.spawnrate}&url=${url}&duration=${benchmarkConfig.duration}`;
    
    // Add model parameter if provided
    const modelParam = benchmarkConfig.model ? `&model=${encodeURIComponent(benchmarkConfig.model)}` : '';
    
    try {
      // Call the benchmark API
      const response = await axios.post(benchmarkUrl + modelParam, '', {
        headers: {
          'accept': 'application/json'
        }
      });
      
      // Validate response data
      const result = benchmarkResultSchema.parse(response.data);
      
      // Store the benchmark test in the database
      const test = await storage.createBenchmarkTest({
        url: benchmarkConfig.url,
        user: benchmarkConfig.user,
        spawnrate: benchmarkConfig.spawnrate,
        duration: benchmarkConfig.duration,
        model: result.configuration.model,
        tokenizer: result.configuration.tokenizer,
        status: result.status,
        results: result
      });
      
      return res.status(200).json(result);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle API request errors
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || 'An error occurred during the benchmark test';
        
        return res.status(statusCode).json({
          message: `Benchmark API Error: ${message}`
        });
      }
      
      throw error;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: validationError.message
      });
    }
    
    console.error('Benchmark error:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred'
    });
  }
});

// Route to get benchmark test history
app.get("/api/benchmarks", async (req, res) => {
  try {
    const benchmarks = await storage.getBenchmarkTests();
    return res.status(200).json(benchmarks);
  } catch (error) {
    console.error('Error fetching benchmark history:', error);
    return res.status(500).json({
      message: 'Failed to fetch benchmark history'
    });
  }
});

// Route to get a specific benchmark test by ID
app.get("/api/benchmarks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        message: 'Invalid benchmark ID'
      });
    }
    
    const benchmark = await storage.getBenchmarkTest(id);
    if (!benchmark) {
      return res.status(404).json({
        message: 'Benchmark test not found'
      });
    }
    
    return res.status(200).json(benchmark);
  } catch (error) {
    console.error('Error fetching benchmark test:', error);
    return res.status(500).json({
      message: 'Failed to fetch benchmark test'
    });
  }
});

// We don't need to copy files around since we have proper paths
// Just log where the client files are located for debugging
function logClientFilesLocations() {
  console.log("Checking client files locations...");
  
  try {
    // Log all paths we're checking for index.html
    const possiblePaths = [
      path.join(__dirname, '../dist/public/index.html'),
      path.join(__dirname, '../client/dist/index.html'),
      path.join(__dirname, '../dist/client/index.html'),
      path.join(__dirname, '../dist/index.html')
    ];
    
    console.log('Checking for index.html files:');
    for (const p of possiblePaths) {
      console.log(`- ${p} exists: ${fs.existsSync(p)}`);
    }
  } catch (err) {
    console.error("Error checking client files:", err);
  }
}

// Just log where files are located
logClientFilesLocations();

// Create HTTP server
const httpServer = createServer(app);

// Start the server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});

// Add catch-all route last (after API routes are registered)
// All other routes serve the main index.html file
app.get('*', (req, res) => {
  // Try multiple potential locations for index.html
  const possiblePaths = [
    path.join(__dirname, '../dist/public/index.html'),
    path.join(__dirname, '../client/dist/index.html'),
    path.join(__dirname, '../dist/client/index.html'),
    path.join(__dirname, '../dist/index.html')
  ];
  
  // Try each path until we find one that exists
  for (const indexPath of possiblePaths) {
    if (fs.existsSync(indexPath)) {
      console.log(`Found index.html at ${indexPath}`);
      return res.sendFile(indexPath);
    }
  }
  
  // If we get here, we didn't find index.html
  console.error(`Error: index.html not found in any of the expected locations`);
  
  // Log directory contents for debugging
  try {
    console.log('Checking directory structure...');
    
    const rootDir = path.join(__dirname, '..');
    console.log(`Contents of ${rootDir}:`, fs.readdirSync(rootDir));
    
    const distPath = path.join(__dirname, '../dist');
    if (fs.existsSync(distPath)) {
      console.log(`Contents of ${distPath}:`, fs.readdirSync(distPath));
    }
    
    const clientDistPath = path.join(__dirname, '../client/dist');
    if (fs.existsSync(clientDistPath)) {
      console.log(`Contents of ${clientDistPath}:`, fs.readdirSync(clientDistPath));
    }
    
  } catch (error) {
    console.error('Error listing directory contents:', error);
  }
  
  return res.status(404).send('Application files not found. Please contact support.');
});