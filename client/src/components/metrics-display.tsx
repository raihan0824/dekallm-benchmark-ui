import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { MetricsDisplayProps } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export function MetricsDisplay({ results }: MetricsDisplayProps) {
  const metrics = results.results?.metrics;
  const config = results.results?.configuration;
  
  if (!metrics || !config) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No metrics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Test Overview */}
      <Card>
        <CardHeader className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-gray-900">Test Results</CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
              {results.results?.status || results.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <h3 className="text-base font-medium text-gray-900">Configuration</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Users</div>
              <div className="mt-1 text-base font-semibold">{config.user || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Spawn Rate</div>
              <div className="mt-1 text-base font-semibold">{config.spawnrate || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Duration</div>
              <div className="mt-1 text-base font-semibold">{config.duration || 0}s</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">URL</div>
              <div className="mt-1 text-base font-semibold truncate" title={config.url || ''}>
                {config.url || 'N/A'}
              </div>
            </div>
            <div className="col-span-2 md:col-span-4">
              <div className="text-sm font-medium text-gray-500">Model</div>
              <div className="mt-1 text-base font-semibold">{config.model || 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Throughput Metrics */}
      <Card>
        <CardHeader className="px-6 py-5 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Throughput</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-base font-medium text-gray-900">Input Tokens/Second</div>
            <div className="mt-2 text-3xl font-bold text-primary">
              {formatNumber(metrics.throughput?.input_tokens_per_second || 0)}
            </div>
          </div>
          <div>
            <div className="text-base font-medium text-gray-900">Output Tokens/Second</div>
            <div className="mt-2 text-3xl font-bold text-indigo-500">
              {formatNumber(metrics.throughput?.output_tokens_per_second || 0)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latency Metrics */}
      <Card>
        <CardHeader className="px-6 py-5 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Latency Metrics</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {/* TTFT Metrics */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-base font-medium text-gray-900">Time to First Token (ms)</h3>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Average</div>
                <div className="mt-1 text-xl font-semibold text-primary">
                  {formatNumber(metrics.time_to_first_token?.average || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Median</div>
                <div className="mt-1 text-xl font-semibold text-primary">
                  {formatNumber(metrics.time_to_first_token?.median || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Min</div>
                <div className="mt-1 text-xl font-semibold text-primary">
                  {formatNumber(metrics.time_to_first_token?.minimum || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Max</div>
                <div className="mt-1 text-xl font-semibold text-primary">
                  {formatNumber(metrics.time_to_first_token?.maximum || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* E2E Latency Metrics */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-base font-medium text-gray-900">End-to-End Latency (ms)</h3>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Average</div>
                <div className="mt-1 text-xl font-semibold text-indigo-500">
                  {formatNumber(metrics.end_to_end_latency?.average || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Median</div>
                <div className="mt-1 text-xl font-semibold text-indigo-500">
                  {formatNumber(metrics.end_to_end_latency?.median || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Min</div>
                <div className="mt-1 text-xl font-semibold text-indigo-500">
                  {formatNumber(metrics.end_to_end_latency?.minimum || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Max</div>
                <div className="mt-1 text-xl font-semibold text-indigo-500">
                  {formatNumber(metrics.end_to_end_latency?.maximum || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Inter-token Latency Metrics */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-base font-medium text-gray-900">Inter-Token Latency (ms)</h3>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Average</div>
                <div className="mt-1 text-xl font-semibold text-green-500">
                  {formatNumber(metrics.inter_token_latency?.average || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Median</div>
                <div className="mt-1 text-xl font-semibold text-green-500">
                  {formatNumber(metrics.inter_token_latency?.median || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Min</div>
                <div className="mt-1 text-xl font-semibold text-green-500">
                  {formatNumber(metrics.inter_token_latency?.minimum || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Max</div>
                <div className="mt-1 text-xl font-semibold text-green-500">
                  {formatNumber(metrics.inter_token_latency?.maximum || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Token Speed Metrics */}
          <div>
            <h3 className="text-base font-medium text-gray-900">Token Speed (tokens/sec)</h3>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Average</div>
                <div className="mt-1 text-xl font-semibold text-amber-500">
                  {formatNumber(metrics.token_speed?.average || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Median</div>
                <div className="mt-1 text-xl font-semibold text-amber-500">
                  {formatNumber(metrics.token_speed?.median || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Min</div>
                <div className="mt-1 text-xl font-semibold text-amber-500">
                  {formatNumber(metrics.token_speed?.minimum || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Max</div>
                <div className="mt-1 text-xl font-semibold text-amber-500">
                  {formatNumber(metrics.token_speed?.maximum || 0)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
