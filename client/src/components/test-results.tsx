import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, FileDown, FileText } from "lucide-react";
import { TestResultsProps } from "@/lib/types";
import { MetricsDisplay } from "./metrics-display";
import { ChartCard } from "./ui/chart-card";
import { downloadJson, getMetricChartData, getMetricColors } from "@/lib/utils";

export function TestResults({ results, isLoading, error }: TestResultsProps) {
  const handleExportJson = () => {
    if (results) {
      downloadJson(results, `benchmark-results-${new Date().toISOString()}.json`);
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
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Test Failed</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Results state
  return (
    <div className="space-y-8">
      {/* Display metrics */}
      <MetricsDisplay results={results} />

      {/* Chart displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['time_to_first_token', 'end_to_end_latency', 'inter_token_latency', 'token_speed'].map((metric) => {
          const { data, labels } = getMetricChartData(results, metric as keyof typeof results.metrics);
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
      <ChartCard 
        title="Throughput (tokens/sec)"
        chartId="throughput-chart"
        data={[
          results.metrics.throughput.input_tokens_per_second,
          results.metrics.throughput.output_tokens_per_second
        ]}
        labels={['Input Tokens/s', 'Output Tokens/s']}
        color="hsl(var(--chart-5))"
        borderColor="hsl(var(--chart-5))"
        className="col-span-full"
      />

      {/* Export buttons */}
      <div className="flex justify-end">
        <Button variant="outline" className="mr-3" onClick={handleExportJson}>
          <FileDown className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}
