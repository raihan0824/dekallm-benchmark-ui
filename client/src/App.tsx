import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/app-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import BenchmarkPage from "@/pages/benchmark";
import DataPage from "@/pages/data";

function Router() {
  return (
    <AppLayout>
      <ErrorBoundary>
        <Switch>
          <Route path="/" component={BenchmarkPage} />
          <Route path="/data" component={DataPage} />
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
