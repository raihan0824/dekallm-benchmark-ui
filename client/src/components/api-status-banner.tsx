import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ApiStatusBanner() {
  // API status can be "unknown", "available", or "unavailable"
  const [apiStatus, setApiStatus] = useState<"unknown" | "available" | "unavailable">("unknown");
  const [isVisible, setIsVisible] = useState(true);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    // Check API status on component mount
    const checkApiStatus = async () => {
      try {
        // Try to fetch benchmark history - if it works, the backend API is responding
        await apiRequest('GET', '/api/benchmarks');
        // If we get here, API responded, but we should check if there have been any test runs
        // If not, the benchmark API might still be unavailable even if our backend works
        setApiStatus("available");
      } catch (error) {
        console.error("API status check failed:", error);
        setApiStatus("unavailable");
      } finally {
        setCheckCount(prev => prev + 1);
      }
    };
    
    checkApiStatus();
    
    // Recheck every 30 seconds, but only if currently unavailable
    const interval = setInterval(() => {
      if (apiStatus === "unavailable" || apiStatus === "unknown") {
        checkApiStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [apiStatus]);

  // Hide after 3 checks if API is available
  useEffect(() => {
    if (apiStatus === "available" && checkCount > 3) {
      setIsVisible(false);
    }
  }, [apiStatus, checkCount]);

  // Don't show anything if hidden or if API status is still unknown on first check
  if (!isVisible || (apiStatus === "unknown" && checkCount < 2)) {
    return null;
  }

  // If API is available, show a success message that auto-hides
  if (apiStatus === "available") {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">API Connected</AlertTitle>
        <AlertDescription className="text-green-700">
          The benchmark API is currently online and available.
        </AlertDescription>
      </Alert>
    );
  }

  // If API is unavailable, show a warning message
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Benchmark API Unavailable</AlertTitle>
      <AlertDescription>
        <p className="mb-2">The Benchmark API is currently experiencing connectivity issues. New tests may fail to run.</p>
        <div className="text-sm font-medium">
          <ul className="list-disc list-inside">
            <li>This is a temporary issue with the remote server</li>
            <li>The app will automatically retry connecting every 30 seconds</li>
            <li>Existing test results are still available</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}