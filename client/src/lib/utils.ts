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
