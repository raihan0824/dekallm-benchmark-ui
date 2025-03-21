import { BenchmarkConfig, BenchmarkResult, BenchmarkTest } from "@shared/schema";

export type TestHistoryItem = {
  id: number;
  url: string;
  user: number;
  spawnrate: number;
  duration: number;
  model?: string;
  status: string;
  createdAt: string;
};

export type TestConfigFormProps = {
  onSubmit: (config: BenchmarkConfig) => void;
  isLoading: boolean;
};

export type TestResultsProps = {
  results: BenchmarkResult | null;
  isLoading: boolean;
  error: string | null;
};

export type ChartCardProps = {
  title: string;
  chartId: string;
  data: number[];
  labels: string[];
  color: string;
  borderColor: string;
  className?: string;
};

export type MetricsDisplayProps = {
  results: BenchmarkResult;
};

export type TestHistoryProps = {
  history: TestHistoryItem[];
  onSelectTest: (id: number) => void;
  isLoading: boolean;
};

export type AppState = {
  isLoading: boolean;
  results: BenchmarkResult | null;
  error: string | null;
  selectedTestId: number | null;
};
