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

// Helper function to ensure client files are copied to all possible locations
// This is a runtime backup in case the Docker build misses something
function ensureClientFiles() {
  console.log("Ensuring client files are in all required locations...");
  
  try {
    // Possible source locations where client files may have been built
    const possibleSourceDirs = [
      path.join(__dirname, '../client/dist'),
      path.join(__dirname, '../dist/public'),
      path.join(__dirname, '../dist/client')
    ];
    
    // Target locations where files need to be
    const targetDirs = [
      path.join(__dirname, '../client/dist'),
      path.join(__dirname, '../dist/client'),
      path.join(__dirname, '../dist/public')
    ];
    
    // Find a valid source directory
    let sourceDir = null;
    for (const dir of possibleSourceDirs) {
      if (fs.existsSync(dir) && 
          fs.existsSync(path.join(dir, 'index.html'))) {
        sourceDir = dir;
        console.log(`Found valid source directory: ${sourceDir}`);
        break;
      }
    }
    
    if (!sourceDir) {
      console.log("No valid source directory found with client files");
      return;
    }
    
    // Copy to all target directories
    for (const targetDir of targetDirs) {
      if (targetDir !== sourceDir) {
        try {
          // Create target directory if it doesn't exist
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
            console.log(`Created target directory: ${targetDir}`);
          }
          
          // Copy index.html
          const sourceIndex = path.join(sourceDir, 'index.html');
          const targetIndex = path.join(targetDir, 'index.html');
          
          if (fs.existsSync(sourceIndex)) {
            fs.copyFileSync(sourceIndex, targetIndex);
            console.log(`Copied index.html to ${targetDir}`);
          }
          
          // Copy assets directory if it exists
          const sourceAssets = path.join(sourceDir, 'assets');
          const targetAssets = path.join(targetDir, 'assets');
          
          if (fs.existsSync(sourceAssets)) {
            // Create target assets directory
            if (!fs.existsSync(targetAssets)) {
              fs.mkdirSync(targetAssets, { recursive: true });
            }
            
            // Copy all files in assets
            const assetFiles = fs.readdirSync(sourceAssets);
            for (const file of assetFiles) {
              const sourcePath = path.join(sourceAssets, file);
              const targetPath = path.join(targetAssets, file);
              
              if (fs.statSync(sourcePath).isFile()) {
                fs.copyFileSync(sourcePath, targetPath);
              }
            }
            console.log(`Copied assets to ${targetDir}`);
          }
        } catch (err) {
          console.error(`Error copying to ${targetDir}:`, err);
        }
      }
    }
    
    // Log all paths we're checking for index.html
    console.log('All paths being checked for index.html:');
    [
      path.join(__dirname, '../dist/public/index.html'),
      path.join(__dirname, '../client/dist/index.html'),
      path.join(__dirname, '../dist/client/index.html'),
      path.join(__dirname, '../dist/index.html')
    ].forEach(p => {
      console.log(`- ${p} exists: ${fs.existsSync(p)}`);
    });
    
  } catch (err) {
    console.error("Error ensuring client files:", err);
  }
}

// Run the function to ensure client files are in all needed locations
ensureClientFiles();

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