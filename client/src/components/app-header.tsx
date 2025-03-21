import { Link } from "wouter";

export function AppHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <img src="/images/logo.png" alt="DekaLLM Logo" className="h-8 w-auto" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">DekaLLM Benchmark UI</h1>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
