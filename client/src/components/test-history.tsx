import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestHistoryProps } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function TestHistory({ history, onSelectTest, isLoading }: TestHistoryProps) {
  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader className="px-6 py-5 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Test History</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-2 border-b border-gray-200 last:border-0">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="mt-1 flex items-center">
                <Skeleton className="h-4 w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Test History</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {history.length === 0 ? (
          <div className="text-sm text-gray-500 italic">No recent tests</div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="py-2 border-b border-gray-200 last:border-0">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium truncate max-w-[70%]" title={item.model || "Unknown model"}>{item.model || "Unknown model"}</div>
                <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
              </div>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-gray-500">Users: {item.user}</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">Duration: {item.duration}s</span>
              </div>
              <Button 
                variant="link" 
                size="sm" 
                className="mt-1 p-0 h-auto text-xs text-primary hover:text-primary/80"
                onClick={() => onSelectTest(item.id)}
              >
                View Results
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
