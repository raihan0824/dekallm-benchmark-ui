import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BenchmarkResponse } from "@shared/schema";
import { Clock, Zap, Users, Globe, Timer, TrendingUp } from "lucide-react";

interface BenchmarkChartProps {
  benchmarkData: BenchmarkResponse | null;
}

export function BenchmarkChart({ benchmarkData }: BenchmarkChartProps) {
  if (!benchmarkData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Results</CardTitle>
          <CardDescription>Select a model from the data table to view detailed results</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No model selected
        </CardContent>
      </Card>
    );
  }

  const { results, model, user, duration, url, createdAt, dataset } = benchmarkData;
  const { metrics, configuration } = results;

  // Calculate relative performance scores (0-100)
  const getPerformanceScore = (value: number, min: number, max: number) => {
    return Math.max(0, Math.min(100, ((max - value) / (max - min)) * 100));
  };

  const latencyScore = getPerformanceScore(
    metrics.end_to_end_latency.average,
    1000, // Best case: 1s
    10000  // Worst case: 10s
  );

  const throughputScore = Math.min(100, (metrics.throughput.output_tokens_per_second / 100) * 100);
  const tokenSpeedScore = Math.min(100, (metrics.token_speed.average / 30) * 100);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{model}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {user} users
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {duration}s
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {url}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {dataset}
                </span>
              </CardDescription>
            </div>
            <Badge variant="default">{results.status}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Latency Score</span>
              <span className="text-sm text-muted-foreground">{latencyScore.toFixed(0)}%</span>
            </div>
            <Progress value={latencyScore} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Throughput Score</span>
              <span className="text-sm text-muted-foreground">{throughputScore.toFixed(0)}%</span>
            </div>
            <Progress value={throughputScore} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Token Speed Score</span>
              <span className="text-sm text-muted-foreground">{tokenSpeedScore.toFixed(0)}%</span>
            </div>
            <Progress value={tokenSpeedScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latency Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Latency Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Time to First Token</span>
                <span className="text-sm font-mono">{metrics.time_to_first_token.average.toFixed(2)}ms</span>
              </div>
              <div className="text-xs text-muted-foreground pl-4">
                Min: {metrics.time_to_first_token.minimum.toFixed(2)}ms, 
                Max: {metrics.time_to_first_token.maximum.toFixed(2)}ms,
                Median: {metrics.time_to_first_token.median.toFixed(2)}ms
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">End-to-End Latency</span>
                <span className="text-sm font-mono">{metrics.end_to_end_latency.average.toFixed(2)}ms</span>
              </div>
              <div className="text-xs text-muted-foreground pl-4">
                Min: {metrics.end_to_end_latency.minimum.toFixed(2)}ms, 
                Max: {metrics.end_to_end_latency.maximum.toFixed(2)}ms,
                Median: {metrics.end_to_end_latency.median.toFixed(2)}ms
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Inter Token Latency</span>
                <span className="text-sm font-mono">{metrics.inter_token_latency.average.toFixed(2)}ms</span>
              </div>
              <div className="text-xs text-muted-foreground pl-4">
                Min: {metrics.inter_token_latency.minimum.toFixed(2)}ms, 
                Max: {metrics.inter_token_latency.maximum.toFixed(2)}ms,
                Median: {metrics.inter_token_latency.median.toFixed(2)}ms
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Throughput & Speed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Throughput & Speed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Token Speed</span>
                <span className="text-sm font-mono">{metrics.token_speed.average.toFixed(2)} t/s</span>
              </div>
              <div className="text-xs text-muted-foreground pl-4">
                Min: {metrics.token_speed.minimum.toFixed(2)} t/s, 
                Max: {metrics.token_speed.maximum.toFixed(2)} t/s,
                Median: {metrics.token_speed.median.toFixed(2)} t/s
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Input Throughput</span>
                <span className="text-sm font-mono">{metrics.throughput.input_tokens_per_second.toFixed(2)} t/s</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Output Throughput</span>
                <span className="text-sm font-mono">{metrics.throughput.output_tokens_per_second.toFixed(2)} t/s</span>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Created: {new Date(createdAt).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}