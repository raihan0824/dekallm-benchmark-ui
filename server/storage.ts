import { users, type User, type InsertUser, type BenchmarkTest, type InsertBenchmarkTest, type BenchmarkResult } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Benchmark test methods
  getBenchmarkTests(): Promise<BenchmarkTest[]>;
  getBenchmarkTest(id: number): Promise<BenchmarkTest | undefined>;
  createBenchmarkTest(test: InsertBenchmarkTest & { results?: BenchmarkResult }): Promise<BenchmarkTest>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private benchmarkTests: Map<number, BenchmarkTest>;
  currentId: number;
  currentBenchmarkId: number;

  constructor() {
    this.users = new Map();
    this.benchmarkTests = new Map();
    this.currentId = 1;
    this.currentBenchmarkId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBenchmarkTests(): Promise<BenchmarkTest[]> {
    return Array.from(this.benchmarkTests.values()).sort((a, b) => {
      // Sort by createdAt in descending order (newest first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getBenchmarkTest(id: number): Promise<BenchmarkTest | undefined> {
    return this.benchmarkTests.get(id);
  }

  async createBenchmarkTest(insertTest: InsertBenchmarkTest & { results?: BenchmarkResult }): Promise<BenchmarkTest> {
    const id = this.currentBenchmarkId++;
    const now = new Date();
    const test: BenchmarkTest = {
      ...insertTest,
      id,
      createdAt: now,
      // Ensure properties match BenchmarkTest type
      model: insertTest.model || null,
      tokenizer: insertTest.tokenizer || null,
      results: insertTest.results || null
    };
    this.benchmarkTests.set(id, test);
    return test;
  }
}

export const storage = new MemStorage();
