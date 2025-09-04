import { BenchmarkConfig, BenchmarkResponse, BenchmarkListResponse } from "@shared/schema";

const API_BASE_URL = "/api";

export class ApiClient {
  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResponse> {
    return this.fetchWithErrorHandling<BenchmarkResponse>(`${API_BASE_URL}/benchmarks`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getBenchmarks(page: number = 1, limit: number = 10): Promise<BenchmarkListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return this.fetchWithErrorHandling<BenchmarkListResponse>(
      `${API_BASE_URL}/benchmarks?${params}`
    );
  }

  async getBenchmarkById(id: number): Promise<BenchmarkResponse> {
    return this.fetchWithErrorHandling<BenchmarkResponse>(
      `${API_BASE_URL}/benchmarks/${id}`
    );
  }
}

export const apiClient = new ApiClient();

// Helper functions for data processing (replacing mock data functions)
export function getGroupedModels(benchmarks: BenchmarkResponse[]): Array<{
  model: string;
  latestData: BenchmarkResponse;
  createdAt: string;
  allVersions: BenchmarkResponse[];
  hasMultipleVersions: boolean;
}> {
  const modelGroups = new Map<string, BenchmarkResponse[]>();
  
  // Group by model name
  benchmarks.forEach(benchmark => {
    if (!modelGroups.has(benchmark.model)) {
      modelGroups.set(benchmark.model, []);
    }
    modelGroups.get(benchmark.model)!.push(benchmark);
  });
  
  // Sort each group by created_at (newest first) and create result
  return Array.from(modelGroups.entries()).map(([model, versions]) => {
    const sortedVersions = versions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return {
      model,
      latestData: sortedVersions[0],
      createdAt: sortedVersions[0].createdAt,
      allVersions: sortedVersions,
      hasMultipleVersions: sortedVersions.length > 1
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Get benchmark data by model name (returns latest)
export function getBenchmarkByModel(benchmarks: BenchmarkResponse[], modelName: string): BenchmarkResponse | undefined {
  const modelData = benchmarks
    .filter(benchmark => benchmark.model === modelName)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return modelData[0];
}