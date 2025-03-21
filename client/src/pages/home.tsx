import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { TestConfigForm } from "@/components/test-config-form";
import { TestResults } from "@/components/test-results";
import { TestHistory } from "@/components/test-history";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BenchmarkConfig, BenchmarkResult, BenchmarkTest } from "@shared/schema";
import { type TestHistoryItem, type AppState } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [state, setState] = useState<AppState>({
    isLoading: false,
    results: null,
    error: null,
    selectedTestId: null,
  });

  // Fetch test history
  const { 
    data: historyData = [],
    isLoading: historyLoading,
    error: historyError
  } = useQuery<BenchmarkTest[]>({
    queryKey: ['/api/benchmarks'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Format history data
  const history: TestHistoryItem[] = historyData.map((item: any) => ({
    id: item.id,
    url: item.url,
    user: item.user,
    spawnrate: item.spawnrate,
    duration: item.duration,
    model: item.model,
    status: item.status,
    createdAt: item.createdAt,
  }));

  // Mutation for running a benchmark test
  const runBenchmarkMutation = useMutation({
    mutationFn: async (config: BenchmarkConfig) => {
      const response = await apiRequest('POST', '/api/benchmarks', config);
      return response.json();
    },
    onMutate: () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    },
    onSuccess: (data: BenchmarkResult) => {
      setState(prev => ({ ...prev, isLoading: false, results: data, error: null }));
      queryClient.invalidateQueries({ queryKey: ['/api/benchmarks'] });
      toast({
        title: "Benchmark Test Completed",
        description: "The test results are now available.",
      });
    },
    onError: (error: Error) => {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || "Failed to run benchmark test" 
      }));
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: error.message || "Failed to run benchmark test",
      });
    }
  });

  // Handle selecting a test from history
  const handleSelectTest = async (id: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, selectedTestId: id }));
      
      const response = await fetch(`/api/benchmarks/${id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch test: ${response.statusText}`);
      }
      
      const testData = await response.json();
      
      if (testData && testData.results) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          results: testData.results, 
          error: null 
        }));
      } else {
        throw new Error("Test results not found");
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Failed to load test results" 
      }));
      
      toast({
        variant: "destructive",
        title: "Failed to Load Test",
        description: error instanceof Error ? error.message : "Failed to load test results",
      });
    }
  };

  // Handle form submission
  const handleRunTest = (config: BenchmarkConfig) => {
    runBenchmarkMutation.mutate(config);
  };

  // Handle history error with useEffect to avoid re-renders
  useEffect(() => {
    if (historyError) {
      toast({
        variant: "destructive",
        title: "Failed to Load History",
        description: "Could not load benchmark history. Please try again later.",
      });
    }
  }, [historyError, toast]);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <TestConfigForm
              onSubmit={handleRunTest}
              isLoading={state.isLoading}
            />
            
            <TestHistory
              history={history}
              onSelectTest={handleSelectTest}
              isLoading={historyLoading}
            />
          </div>
          
          <div className="lg:col-span-2">
            <TestResults
              results={state.results}
              isLoading={state.isLoading}
              error={state.error}
            />
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
