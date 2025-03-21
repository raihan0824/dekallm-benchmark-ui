import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BenchmarkResult } from "@shared/schema";

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

export function downloadCsv(data: BenchmarkResult, filename: string) {
  // Create CSV header rows
  let csvContent = "DekaLLM Benchmark Results\n";
  csvContent += `Date,${new Date().toLocaleString()}\n\n`;
  
  // Add configuration section
  csvContent += "Test Configuration\n";
  csvContent += "Parameter,Value\n";
  csvContent += `Model,${data.configuration.model || 'Not specified'}\n`;
  csvContent += `URL,${data.configuration.url}\n`;
  csvContent += `Concurrent Users,${data.configuration.user}\n`;
  csvContent += `Spawn Rate,${data.configuration.spawnrate}\n`;
  csvContent += `Duration (seconds),${data.configuration.duration}\n`;
  csvContent += `Tokenizer,${data.configuration.tokenizer || 'Not specified'}\n`;
  csvContent += `Status,${data.status}\n\n`;
  
  // Add metrics section
  csvContent += "Time to First Token (ms)\n";
  csvContent += "Average,Median,Min,Max\n";
  csvContent += `${data.metrics.time_to_first_token.average},${data.metrics.time_to_first_token.median},${data.metrics.time_to_first_token.minimum},${data.metrics.time_to_first_token.maximum}\n\n`;
  
  csvContent += "End-to-End Latency (ms)\n";
  csvContent += "Average,Median,Min,Max\n";
  csvContent += `${data.metrics.end_to_end_latency.average},${data.metrics.end_to_end_latency.median},${data.metrics.end_to_end_latency.minimum},${data.metrics.end_to_end_latency.maximum}\n\n`;
  
  csvContent += "Inter-Token Latency (ms)\n";
  csvContent += "Average,Median,Min,Max\n";
  csvContent += `${data.metrics.inter_token_latency.average},${data.metrics.inter_token_latency.median},${data.metrics.inter_token_latency.minimum},${data.metrics.inter_token_latency.maximum}\n\n`;
  
  csvContent += "Token Speed (tokens/s)\n";
  csvContent += "Average,Median,Min,Max\n";
  csvContent += `${data.metrics.token_speed.average},${data.metrics.token_speed.median},${data.metrics.token_speed.minimum},${data.metrics.token_speed.maximum}\n\n`;
  
  csvContent += "Throughput (tokens/s)\n";
  csvContent += "Input,Output\n";
  csvContent += `${data.metrics.throughput.input_tokens_per_second},${data.metrics.throughput.output_tokens_per_second}\n`;
  
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

export function getMetricChartData(results: BenchmarkResult, metricKey: keyof BenchmarkResult['metrics']): {
  data: number[];
  labels: string[];
} {
  const metric = results.metrics[metricKey];
  
  if ('average' in metric) {
    return {
      data: [
        metric.average,
        metric.median,
        metric.minimum,
        metric.maximum
      ],
      labels: ['Average', 'Median', 'Min', 'Max']
    };
  } else if ('input_tokens_per_second' in metric) {
    return {
      data: [
        metric.input_tokens_per_second,
        metric.output_tokens_per_second
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
