import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Fetch test history
  const { 
    data: historyData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/benchmarks'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    toast({
      variant: "destructive",
      title: "Failed to Load History",
      description: "Could not load benchmark history. Please try again later.",
    });
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Benchmark History</h1>
          <Link href="/">
            <Button>Run New Test</Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 border-b border-gray-200">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                ))}
              </div>
            ) : historyData?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No benchmark tests have been run yet.</p>
                <Link href="/">
                  <Button className="mt-4">Run Your First Test</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {historyData?.map((test: any) => (
                  <div key={test.id} className="flex justify-between items-center p-4 border-b border-gray-200 last:border-b-0">
                    <div>
                      <h3 className="font-medium text-gray-900 truncate max-w-md" title={test.url}>
                        {test.url}
                      </h3>
                      <div className="text-sm text-gray-500 mt-1">
                        <span>Users: {test.user}</span>
                        <span className="mx-2">•</span>
                        <span>Duration: {test.duration}s</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(test.createdAt)}</span>
                      </div>
                    </div>
                    <Link href={`/?id=${test.id}`}>
                      <Button variant="secondary" size="sm">View Results</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <AppFooter />
    </div>
  );
}
