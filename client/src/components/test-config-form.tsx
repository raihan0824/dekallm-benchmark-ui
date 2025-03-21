import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TestConfigFormProps } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { benchmarkConfigSchema, type BenchmarkConfig } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function TestConfigForm({ onSubmit, isLoading }: TestConfigFormProps) {
  const form = useForm<BenchmarkConfig>({
    resolver: zodResolver(benchmarkConfigSchema),
    defaultValues: {
      url: "",
      user: 100,
      spawnrate: 100,
      duration: 60,
      model: ""
    }
  });

  const handleSubmit = (data: BenchmarkConfig) => {
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Load Test Configuration</CardTitle>
        <CardDescription className="text-sm text-gray-500">Configure your benchmark test parameters</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="http://example.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The API endpoint to benchmark
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concurrent Users</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spawnrate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spawn Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="60"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Model name (optional)"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>Run Benchmark Test</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
