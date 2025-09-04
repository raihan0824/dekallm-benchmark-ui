import { TestConfigForm } from "@/components/test-config-form";
import { TestResults } from "@/components/test-results";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BenchmarkConfig, BenchmarkResult } from "@shared/schema";
import { type AppState } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BenchmarkPage() {
  const { toast } = useToast();
  const [state, setState] = useState<AppState>({
    isLoading: false,
    results: null,
    error: null,
    selectedTestId: null,
  });


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

  // Handle form submission
  const handleRunTest = (config: BenchmarkConfig) => {
    runBenchmarkMutation.mutate(config);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Benchmark Testing</h1>
        <p className="text-muted-foreground">
          Configure and run performance benchmarks for language models.
        </p>
      </div>
      
      {/* API Status Banner */}
      <ApiStatusBanner />
      
      <div className="space-y-6">
        {/* Load Test Configuration - Full Width Top */}
        <TestConfigForm
          onSubmit={handleRunTest}
          isLoading={state.isLoading}
        />
        
        {/* Results Section - Full Width Bottom */}
        {(state.results || state.isLoading || state.error) && (
          <TestResults
            results={state.results}
            isLoading={state.isLoading}
            error={state.error}
          />
        )}
      </div>
    </div>
  );
}