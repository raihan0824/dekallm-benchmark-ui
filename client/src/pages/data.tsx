import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { BenchmarkChart } from "@/components/benchmark-chart";
import { TestResults } from "@/components/test-results";
import { BenchmarkResponse } from "@shared/schema";

export default function DataPage() {
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkResponse | null>(null);

  const handleBenchmarkSelect = (benchmarkData: BenchmarkResponse) => {
    setSelectedBenchmark(benchmarkData);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Benchmark Data</h1>
        <p className="text-muted-foreground">
          View and analyze benchmark results for different models. Click on a model to see detailed metrics.
        </p>
      </div>
      
      <div className="space-y-6">
        <DataTable onBenchmarkSelect={handleBenchmarkSelect} />
        
        {selectedBenchmark && (
          <TestResults
            results={selectedBenchmark.results}
            isLoading={false}
            error={null}
          />
        )}
      </div>
    </div>
  );
}