import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BenchmarkResponse, BenchmarkResults } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

export function downloadJson(data: any, filename: string) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function downloadCsv(data: BenchmarkResponse, filename: string) {
  // Create CSV header rows
  let csvContent = "DekaLLM Benchmark Results\n";
  csvContent += `Date,${new Date().toLocaleString()}\n\n`;
  
  // Add configuration section
  csvContent += "Test Configuration\n";
  csvContent += "Parameter,Value\n";
  csvContent += `Model,${data.results.configuration.model || 'Not specified'}\n`;
  csvContent += `URL,${data.results.configuration.url}\n`;
  csvContent += `Concurrent Users,${data.results.configuration.user}\n`;
  csvContent += `Spawn Rate,${data.results.configuration.spawnrate}\n`;
  csvContent += `Duration (seconds),${data.results.configuration.duration}\n`;
  csvContent += `Tokenizer,${data.results.configuration.tokenizer || 'Not specified'}\n`;
  csvContent += `Status,${data.results.status}\n\n`;
  
  // Add metrics section
  csvContent += "Time to First Token (ms)\n";
  csvContent += "Average,Median,Min,Max\n";
  csvContent += `${data.results.metrics.time_to_first_token.average},${data.results.metrics.time_to_first_token.median},${data.results.metrics.time_to_first_token.minimum},${data.results.metrics.time_to_first_token.maximum}\n\n`;
  
  csvContent += "End-to-End Latency (ms)\n";
  csvContent += "Average,Median,Min,Max\n";
  csvContent += `${data.results.metrics.end_to_end_latency.average},${data.results.metrics.end_to_end_latency.median},${data.results.metrics.end_to_end_latency.minimum},${data.results.metrics.end_to_end_latency.maximum}\n\n`;
  
  csvContent += "Inter-Token Latency (ms)\n";
  csvContent += "Average,Median,Min,Max\n";
  csvContent += `${data.results.metrics.inter_token_latency.average},${data.results.metrics.inter_token_latency.median},${data.results.metrics.inter_token_latency.minimum},${data.results.metrics.inter_token_latency.maximum}\n\n`;
  
  csvContent += "Token Speed (tokens/s)\n";
  csvContent += "Average,Median,Min,Max\n";
  csvContent += `${data.results.metrics.token_speed.average},${data.results.metrics.token_speed.median},${data.results.metrics.token_speed.minimum},${data.results.metrics.token_speed.maximum}\n\n`;
  
  csvContent += "Throughput (tokens/s)\n";
  csvContent += "Input,Output\n";
  csvContent += `${data.results.metrics.throughput.input_tokens_per_second},${data.results.metrics.throughput.output_tokens_per_second}\n`;
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getMetricChartData(results: BenchmarkResults, metricKey: keyof BenchmarkResults['metrics']): {
  data: number[];
  labels: string[];
} {
  if (!results?.metrics) {
    return { data: [], labels: [] };
  }
  
  const metric = results.metrics[metricKey];
  
  if (!metric) {
    return { data: [], labels: [] };
  }
  
  if ('average' in metric) {
    return {
      data: [
        metric.average || 0,
        metric.median || 0,
        metric.minimum || 0,
        metric.maximum || 0
      ],
      labels: ['Average', 'Median', 'Min', 'Max']
    };
  } else if ('input_tokens_per_second' in metric) {
    return {
      data: [
        metric.input_tokens_per_second || 0,
        metric.output_tokens_per_second || 0
      ],
      labels: ['Input Tokens/s', 'Output Tokens/s']
    };
  }
  
  return { data: [], labels: [] };
}

export function getMetricColors(metricKey: string): { color: string; borderColor: string } {
  switch (metricKey) {
    case 'time_to_first_token':
      return { color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary-foreground))' };
    case 'end_to_end_latency':
      return { color: 'hsl(var(--chart-2))', borderColor: 'hsl(var(--chart-2))' };
    case 'inter_token_latency':
      return { color: 'hsl(var(--chart-3))', borderColor: 'hsl(var(--chart-3))' };
    case 'token_speed':
      return { color: 'hsl(var(--chart-4))', borderColor: 'hsl(var(--chart-4))' };
    case 'throughput':
      return { color: 'hsl(var(--chart-5))', borderColor: 'hsl(var(--chart-5))' };
    default:
      return { color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary-foreground))' };
  }
}
