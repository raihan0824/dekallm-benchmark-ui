import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Benchmark schema
export const benchmarkTests = pgTable("benchmark_tests", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  user: integer("user").notNull(),
  spawnrate: integer("spawnrate").notNull(),
  duration: integer("duration").notNull(),
  model: text("model"),
  tokenizer: text("tokenizer"),
  status: text("status").notNull(),
  results: json("results"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBenchmarkTestSchema = createInsertSchema(benchmarkTests).pick({
  url: true,
  user: true,
  spawnrate: true,
  duration: true,
  model: true,
  tokenizer: true,
  status: true,
});

export const benchmarkConfigSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  user: z.coerce.number().int().positive("Number of users must be positive"),
  spawnrate: z.coerce.number().int().positive("Spawn rate must be positive"),
  duration: z.coerce.number().int().positive("Duration must be positive"),
  model: z.string().optional(),
});

export type BenchmarkConfig = z.infer<typeof benchmarkConfigSchema>;
export type InsertBenchmarkTest = z.infer<typeof insertBenchmarkTestSchema>;
export type BenchmarkTest = typeof benchmarkTests.$inferSelect;

// Define the response data structure
export const metricStatsSchema = z.object({
  average: z.number(),
  maximum: z.number(),
  minimum: z.number(),
  median: z.number(),
});

export const throughputSchema = z.object({
  input_tokens_per_second: z.number(),
  output_tokens_per_second: z.number(),
});

export const benchmarkResultSchema = z.object({
  status: z.string(),
  metrics: z.object({
    time_to_first_token: metricStatsSchema,
    end_to_end_latency: metricStatsSchema,
    inter_token_latency: metricStatsSchema,
    token_speed: metricStatsSchema,
    throughput: throughputSchema,
  }),
  configuration: z.object({
    user: z.number(),
    spawnrate: z.number(),
    model: z.string(),
    tokenizer: z.string(),
    url: z.string(),
    duration: z.number(),
  }),
});

export type BenchmarkResult = z.infer<typeof benchmarkResultSchema>;
export type MetricStats = z.infer<typeof metricStatsSchema>;
export type Throughput = z.infer<typeof throughputSchema>;
