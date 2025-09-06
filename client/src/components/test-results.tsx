import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, FileDown, FileText } from "lucide-react";
import { TestResultsProps } from "@/lib/types";
import { MetricsDisplay } from "./metrics-display";
import { ChartCard } from "./ui/chart-card";
import { downloadJson, downloadCsv, getMetricChartData, getMetricColors } from "@/lib/utils";
import { BenchmarkResponse } from "@shared/schema";

export function TestResults({ results, isLoading, error }: TestResultsProps) {
  const handleExportJson = () => {
    if (results) {
      downloadJson(results, `benchmark-results-${new Date().toISOString()}.json`);
    }
  };
  
  const handleExportCsv = () => {
    if (results) {
      downloadCsv(results, `benchmark-report-${new Date().toISOString()}.csv`);
    }
  };

  // Initial state (no test run yet)
  if (!results && !isLoading && !error) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <FileText className="h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No Test Results Yet</h3>
        <p className="mt-1 text-sm text-gray-500">Configure and run a test to see results here</p>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Running Benchmark Test</h3>
        <p className="mt-2 text-sm text-gray-500">This may take a while...</p>
        <div className="mt-4 w-64 bg-gray-200 rounded-full h-2.5">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: '50%' }}></div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Please wait...</p>
      </Card>
    );
  }

  // Error state
  if (error) {
    // Determine if this is a connection error
    const isConnectionError = error.includes('ECONNREFUSED') || 
                             error.includes('timeout') || 
                             error.includes('Cannot connect');
    
    return (
      <Card className="p-6 border-destructive">
        <div className="flex items-start space-x-4">
          <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-destructive mb-2">Test Failed</h3>
            <p className="text-sm text-gray-700 mb-4">{error}</p>
            
            {isConnectionError && (
              <div className="bg-amber-50 p-4 rounded-md mt-2">
                <h4 className="font-medium text-amber-800 mb-1">Connection Issue Detected</h4>
                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                  <li>The benchmark API server appears to be unavailable</li>
                  <li>This is likely a temporary issue with the remote server</li>
                  <li>Please try again later or contact your administrator</li>
                </ul>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Safety check - if we somehow got here without results
  if (!results) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-16 w-16 text-yellow-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No Results Available</h3>
        <p className="mt-1 text-sm text-gray-500">Please try running the test again</p>
      </Card>
    );
  }

  // We now know results is not null
  const benchmarkResults: BenchmarkResponse = results;

  // Results state
  return (
    <div className="space-y-8">
      {/* Display metrics */}
      <MetricsDisplay results={benchmarkResults} />

      {/* Chart displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benchmarkResults.results?.metrics && ['time_to_first_token', 'end_to_end_latency', 'inter_token_latency', 'token_speed'].map((metric) => {
          const { data, labels } = getMetricChartData(benchmarkResults.results, metric as keyof typeof benchmarkResults.results.metrics);
          const { color, borderColor } = getMetricColors(metric);
          const metricTitle = metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          return (
            <ChartCard 
              key={metric}
              title={metricTitle}
              chartId={`${metric}-chart`}
              data={data}
              labels={labels}
              color={color}
              borderColor={borderColor}
            />
          );
        })}
      </div>

      {/* Throughput chart */}
      {benchmarkResults.results?.metrics?.throughput && (
        <ChartCard 
          title="Throughput (tokens/sec)"
          chartId="throughput-chart"
          data={[
            benchmarkResults.results.metrics.throughput.input_tokens_per_second || 0,
            benchmarkResults.results.metrics.throughput.output_tokens_per_second || 0
          ]}
          labels={['Input Tokens/s', 'Output Tokens/s']}
          color="hsl(var(--chart-5))"
          borderColor="hsl(var(--chart-5))"
          className="col-span-full"
        />
      )}

      {/* Export buttons */}
      <div className="flex justify-end">
        <Button variant="outline" className="mr-3" onClick={handleExportJson}>
          <FileDown className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button onClick={handleExportCsv}>
          <FileText className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}
