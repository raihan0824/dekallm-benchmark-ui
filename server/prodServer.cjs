// Production server using CommonJS
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const { ZodError } = require('zod');
const { fromZodError } = require('zod-validation-error');

// Simplify error handling for production
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// In-memory storage for the benchmark tests
class MemStorage {
  constructor() {
    this.users = new Map();
    this.benchmarkTests = new Map();
    this.currentId = 1;
    this.currentBenchmarkId = 1;
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser) {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBenchmarkTests() {
    return Array.from(this.benchmarkTests.values()).sort((a, b) => {
      // Sort by createdAt in descending order (newest first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getBenchmarkTest(id) {
    return this.benchmarkTests.get(id);
  }

  async createBenchmarkTest(insertTest) {
    const id = this.currentBenchmarkId++;
    const now = new Date();
    const test = {
      ...insertTest,
      id,
      createdAt: now,
      model: insertTest.model || null,
      tokenizer: insertTest.tokenizer || null,
      results: insertTest.results || null
    };
    this.benchmarkTests.set(id, test);
    return test;
  }
}

const storage = new MemStorage();

// Schema definitions using Zod
const { z } = require('zod');

const metricStatsSchema = z.object({
  mean: z.number(),
  median: z.number(),
  p90: z.number(),
  p95: z.number(),
  p99: z.number(),
  min: z.number(),
  max: z.number()
});

const throughputSchema = z.object({
  total_time: z.number(),
  total_tokens: z.number(),
  tokens_per_second: z.number()
});

const benchmarkConfigSchema = z.object({
  url: z.string().url(),
  user: z.number().int().positive(),
  spawnrate: z.number().int().positive(),
  duration: z.number().int().positive(),
  model: z.string().optional()
});

const benchmarkResultSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  configuration: z.object({
    url: z.string(),
    user: z.number(),
    spawnrate: z.number(),
    duration: z.number(),
    model: z.string().nullable().optional(),
    tokenizer: z.string().nullable().optional(),
  }),
  metrics: z.object({
    time_to_first_token: metricStatsSchema,
    end_to_end_latency: metricStatsSchema,
    inter_token_latency: metricStatsSchema,
    token_speed: metricStatsSchema
  }),
  throughput: throughputSchema,
  raw_data: z.record(z.any()).optional()
});

const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Serve static files from the client/dist directory
app.use(express.static(path.join(__dirname, '../client/dist')));

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

// Add catch-all route last (after API routes are registered)
// All other routes serve the main index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Create HTTP server and start
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});