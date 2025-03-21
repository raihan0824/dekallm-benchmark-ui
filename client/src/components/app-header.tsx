import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { Link } from "wouter";

export function AppHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">Benchmark API Dashboard</h1>
            </div>
          </Link>
          <div className="flex items-center">
            <Button variant="outline" className="mr-2">
              History
            </Button>
            <Button>
              Documentation
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
