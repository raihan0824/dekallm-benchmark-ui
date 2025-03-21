import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { benchmarkConfigSchema, benchmarkResultSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

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

  const httpServer = createServer(app);

  return httpServer;
}
