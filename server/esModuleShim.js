// This file handles proper conversion of TypeScript import paths to JavaScript
// import paths with .js extensions for ES modules in production

import express from 'express';
import { createServer } from 'http';
import axios from 'axios';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// In-memory storage implementation
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

// Schema definitions for validation
const z = await import('zod');

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

// Export the storage instance and schemas
export const storage = new MemStorage();
export { 
  benchmarkConfigSchema,
  benchmarkResultSchema,
  express,
  createServer,
  axios,
  ZodError,
  fromZodError
};