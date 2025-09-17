import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (kept for potential authentication needs)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Benchmark configuration schema for API requests (matches API spec)
export const benchmarkConfigSchema = z.object({
  url: z.string().url("Please enter a valid URL").default("https://dekallm.cloudeka.ai"),
  user: z.coerce.number().int().positive("Number of users must be positive").default(100),
  spawnrate: z.coerce.number().int().positive("Spawn rate must be positive").default(100),
  duration: z.coerce.number().int().positive("Duration must be positive").default(60),
  model: z.string().optional(),
  tokenizer: z.string().optional(),
  dataset: z.string().default("mteb/banking77"),
  api_key: z.string().optional(),
  notes: z.string().optional(),
});

export type BenchmarkConfig = z.infer<typeof benchmarkConfigSchema>;

// API response schemas (matching OpenAPI specification)
export const benchmarkMetricsSchema = z.object({
  average: z.number(),
  maximum: z.number(),
  minimum: z.number(),
  median: z.number(),
});

export const benchmarkThroughputSchema = z.object({
  input_tokens_per_second: z.number(),
  output_tokens_per_second: z.number(),
});

export const benchmarkMetricsDataSchema = z.object({
  time_to_first_token: benchmarkMetricsSchema,
  end_to_end_latency: benchmarkMetricsSchema,
  inter_token_latency: benchmarkMetricsSchema,
  token_speed: benchmarkMetricsSchema,
  throughput: benchmarkThroughputSchema,
});

export const benchmarkConfigurationSchema = z.object({
  user: z.number(),
  spawnrate: z.number(),
  model: z.string(),
  tokenizer: z.string(),
  url: z.string(),
  duration: z.number(),
  dataset: z.string().optional(),
  api_key: z.string().optional(),
  notes: z.string().optional(),
});

export const benchmarkResultsSchema = z.object({
  status: z.string(),
  metrics: benchmarkMetricsDataSchema,
  configuration: benchmarkConfigurationSchema,
});

// Main benchmark response schema
export const benchmarkResponseSchema = z.object({
  id: z.number(),
  url: z.string(),
  user: z.number(),
  spawnrate: z.number(),
  duration: z.number(),
  model: z.string(),
  tokenizer: z.string(),
  dataset: z.string(),
  notes: z.string().optional(),
  favorite: z.boolean().optional(),
  status: z.string(),
  results: benchmarkResultsSchema,
  createdAt: z.string().transform((val) => new Date(val).toISOString()),
});

// List response for paginated results
export const benchmarkListResponseSchema = z.object({
  results: z.array(benchmarkResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Export types
export type BenchmarkMetrics = z.infer<typeof benchmarkMetricsSchema>;
export type BenchmarkThroughput = z.infer<typeof benchmarkThroughputSchema>;
export type BenchmarkMetricsData = z.infer<typeof benchmarkMetricsDataSchema>;
export type BenchmarkConfiguration = z.infer<typeof benchmarkConfigurationSchema>;
export type BenchmarkResults = z.infer<typeof benchmarkResultsSchema>;
export type BenchmarkResponse = z.infer<typeof benchmarkResponseSchema>;
export type BenchmarkListResponse = z.infer<typeof benchmarkListResponseSchema>;

// Backward compatibility
export type BenchmarkTest = BenchmarkResponse;
export type MetricStats = BenchmarkMetrics;
export type Throughput = BenchmarkThroughput;
