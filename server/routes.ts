import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import { benchmarkConfigSchema, benchmarkResponseSchema, benchmarkListResponseSchema } from "@shared/schema";
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
      console.log(`Using Benchmark API URL: ${benchmarkApiUrl}`);
      
      const benchmarkUrl = `${benchmarkApiUrl}/benchmarks/run?user=${benchmarkConfig.user}&spawnrate=${benchmarkConfig.spawnrate}&url=${url}&duration=${benchmarkConfig.duration}&dataset=${encodeURIComponent(benchmarkConfig.dataset)}`;
      
      // Add optional parameters
      const modelParam = benchmarkConfig.model ? `&model=${encodeURIComponent(benchmarkConfig.model)}` : '';
      const tokenizerParam = benchmarkConfig.tokenizer ? `&tokenizer=${encodeURIComponent(benchmarkConfig.tokenizer)}` : '';
      const fullUrl = benchmarkUrl + modelParam + tokenizerParam;
      
      console.log(`Making request to: ${fullUrl}`);
      
      try {
        // Call the benchmark API
        console.log("Sending request to benchmark API...");
        // Decrease timeout for better user experience
        const response = await axios.post(fullUrl, '', {
          headers: {
            'accept': 'application/json'
          },
          timeout: 600000, // 10 minute timeout for benchmark tests
        });
        
        console.log("Received response from benchmark API");
        console.log("Response status:", response.status);
        console.log("Response data keys:", Object.keys(response.data));
        
        if (!response.data) {
          console.error("Response data is empty");
          return res.status(500).json({
            message: "Benchmark API returned empty response"
          });
        }
        
        // Validate response data
        const result = benchmarkResponseSchema.parse(response.data);
        console.log("Validation passed for benchmark result");
        
        // Return the result directly - data is now stored by the benchmark API
        return res.status(200).json(result);
      } catch (error) {
        console.error("Error calling benchmark API:", error);
        
        if (axios.isAxiosError(error)) {
          // Handle API request errors
          const statusCode = error.response?.status || 500;
          let message = error.response?.data?.message || error.message || 'An error occurred during the benchmark test';
          console.error(`Axios error (${statusCode}):`, message);
          
          if (error.response?.data) {
            console.log("Error response data:", error.response.data);
          }
          
          let userMessage = '';
          
          // Provide helpful error messages based on common errors
          if (error.code === 'ECONNREFUSED') {
            userMessage = "Cannot connect to the benchmark API server. The server may be down or the API URL might be incorrect.";
          } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            userMessage = "The benchmark API request timed out. The load test might be taking too long to complete.";
          } else if (error.response?.status === 401) {
            userMessage = "Authentication failed. API access requires valid credentials.";
          } else if (error.response?.status === 400) {
            userMessage = "Bad request. Please check the test parameters: " + message;
          } else {
            userMessage = `Benchmark API Error: ${message}`;
          }
          
          return res.status(statusCode).json({
            message: userMessage,
            error: error.code,
            original_message: message
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

  // Route to get benchmark test history from the benchmark API
  app.get("/api/benchmarks", async (req, res) => {
    try {
      const benchmarkApiUrl = process.env.BENCHMARK_API_URL || 'http://localhost';
      const historyUrl = `${benchmarkApiUrl}/benchmarks`;
      
      console.log(`Fetching benchmark history from: ${historyUrl}`);
      
      const response = await axios.get(historyUrl, {
        headers: {
          'accept': 'application/json'
        },
        timeout: 10000, // 10 second timeout
      });
      
      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error fetching benchmark history:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        let message = error.response?.data?.message || error.message || 'Failed to fetch benchmark history';
        
        return res.status(statusCode).json({
          message: `Benchmark API Error: ${message}`,
          error: error.code
        });
      }
      
      return res.status(500).json({
        message: 'Failed to fetch benchmark history'
      });
    }
  });

  // Route to get a specific benchmark test by ID from the benchmark API
  app.get("/api/benchmarks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          message: 'Invalid benchmark ID'
        });
      }
      
      const benchmarkApiUrl = process.env.BENCHMARK_API_URL || 'http://localhost';
      const benchmarkUrl = `${benchmarkApiUrl}/benchmarks/${id}`;
      
      console.log(`Fetching benchmark test from: ${benchmarkUrl}`);
      
      const response = await axios.get(benchmarkUrl, {
        headers: {
          'accept': 'application/json'
        },
        timeout: 10000, // 10 second timeout
      });
      
      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error fetching benchmark test:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        let message = error.response?.data?.message || error.message || 'Failed to fetch benchmark test';
        
        if (error.response?.status === 404) {
          return res.status(404).json({
            message: 'Benchmark test not found'
          });
        }
        
        return res.status(statusCode).json({
          message: `Benchmark API Error: ${message}`,
          error: error.code
        });
      }
      
      return res.status(500).json({
        message: 'Failed to fetch benchmark test'
      });
    }
  });


  const httpServer = createServer(app);

  return httpServer;
}
