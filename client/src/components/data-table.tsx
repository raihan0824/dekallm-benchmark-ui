import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Activity, ChevronDown, ChevronRight, Clock, Search, ChevronLeft, ChevronRight as ChevronRightIcon, Loader2, Star, Pencil, Trash } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiClient, getGroupedModels } from "@/lib/api";
import { formatDistance } from "date-fns";
import { BenchmarkResponse } from "@shared/schema";

interface DataTableProps {
  onBenchmarkSelect: (benchmarkData: BenchmarkResponse) => void;
}

export function DataTable({ onBenchmarkSelect }: DataTableProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkResponse | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingFavorites, setUpdatingFavorites] = useState<Set<number>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);
  const [activeBenchmark, setActiveBenchmark] = useState<BenchmarkResponse | null>(null);
  const [editNotesValue, setEditNotesValue] = useState("");

  // Fetch benchmarks from API
  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all benchmarks (we'll handle pagination client-side for now)
        const response = await apiClient.getBenchmarks(1, 1000); // Get a large number
        setBenchmarks(response.results);
      } catch (err) {
        console.error('Failed to fetch benchmarks:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch benchmarks';
        setError(`${errorMessage}. Check console for details.`);
        setBenchmarks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmarks();
  }, []);
  
  const allGroupedModels = useMemo(() => getGroupedModels(benchmarks), [benchmarks]);

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return allGroupedModels;
    
    return allGroupedModels.filter(({ model }) =>
      model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allGroupedModels, searchTerm]);

  // Favorites only
  const favoritesFiltered = useMemo(() => {
    if (!showFavoritesOnly) return filteredModels;
    return filteredModels.filter(({ latestData, allVersions }) =>
      !!latestData.favorite || allVersions.some(v => !!(v as any).favorite)
    );
  }, [filteredModels, showFavoritesOnly]);

  // Calculate pagination
  const totalPages = Math.ceil(favoritesFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedModels = favoritesFiltered.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleBenchmarkClick = (benchmarkData: BenchmarkResponse) => {
    setSelectedBenchmark(benchmarkData);
    onBenchmarkSelect(benchmarkData);
  };

  const toggleRowExpansion = (modelName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(modelName)) {
      newExpanded.delete(modelName);
    } else {
      newExpanded.add(modelName);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  const handleToggleFavorite = async (benchmarkId: number, currentFavorite: boolean) => {
    try {
      setUpdatingFavorites(prev => new Set(prev).add(benchmarkId));
      
      const newFavoriteStatus = !currentFavorite;
      await apiClient.updateBenchmarkFavorite(benchmarkId, newFavoriteStatus);
      
      // Update local state
      setBenchmarks(prev => prev.map(benchmark => 
        benchmark.id === benchmarkId 
          ? { ...benchmark, favorite: newFavoriteStatus }
          : benchmark
      ));
    } catch (error) {
      console.error('Failed to update favorite:', error);
      // You could add a toast notification here
    } finally {
      setUpdatingFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(benchmarkId);
        return newSet;
      });
    }
  };

  const openEditNotes = (benchmark: BenchmarkResponse) => {
    setActiveBenchmark(benchmark);
    setDialogMode("edit");
    setEditNotesValue(benchmark.results?.configuration?.notes || (benchmark as any).notes || "");
    setIsDialogOpen(true);
  };

  const openDelete = (benchmark: BenchmarkResponse) => {
    setActiveBenchmark(benchmark);
    setDialogMode("delete");
    setIsDialogOpen(true);
  };

  const confirmDialog = async () => {
    if (!activeBenchmark || !dialogMode) return;
    try {
      if (dialogMode === "edit") {
        await apiClient.updateBenchmarkNotes(activeBenchmark.id, editNotesValue);
        setBenchmarks(prev => prev.map(b => b.id === activeBenchmark.id
          ? { ...b, results: { ...b.results, configuration: { ...b.results.configuration, notes: editNotesValue } }, notes: editNotesValue }
          : b
        ));
      } else if (dialogMode === "delete") {
        await apiClient.deleteBenchmark(activeBenchmark.id);
        setBenchmarks(prev => prev.filter(b => b.id !== activeBenchmark.id));
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsDialogOpen(false);
      setDialogMode(null);
      setActiveBenchmark(null);
    }
  };

  const handleDelete = async (benchmarkId: number) => {
    const ok = window.confirm("Delete this benchmark? This cannot be undone.");
    if (!ok) return;
    try {
      await apiClient.deleteBenchmark(benchmarkId);
      setBenchmarks(prev => prev.filter(b => b.id !== benchmarkId));
    } catch (err) {
      console.error('Failed to delete benchmark:', err);
    }
  };


  const ModelRow = ({ 
    data, 
    isNested = false, 
    isLatest = true 
  }: { 
    data: BenchmarkResponse; 
    isNested?: boolean; 
    isLatest?: boolean;
  }) => (
    <TableRow
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        selectedBenchmark?.id === data.id ? "bg-muted" : ""
      } ${isNested ? "bg-muted/20" : ""}`}
      onClick={() => handleBenchmarkClick(data)}
    >
      <TableCell className={`${isNested ? "pl-8" : ""} font-medium`}>
        <div className="flex items-center space-x-2">
          {isNested && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span className="text-xs">v{data.id}</span>
            </div>
          )}
          <span className={`truncate max-w-[200px] ${isNested ? 'text-sm text-muted-foreground' : ''}`} title={data.model}>
            {isNested ? `${data.model} (older)` : data.model}
          </span>
          {!isNested && !isLatest && (
            <Badge variant="outline" className="text-xs">
              Latest
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className={`font-mono ${isNested ? 'text-xs text-muted-foreground' : 'text-sm'}`}>
          {data.user}
        </span>
      </TableCell>
      <TableCell>
        <span className={`font-mono ${isNested ? 'text-xs text-muted-foreground' : 'text-sm'}`}>
          {data.duration}s
        </span>
      </TableCell>
      <TableCell>
        <span className={`${isNested ? 'text-xs text-muted-foreground' : 'text-sm'}`}>
          {data.dataset}
        </span>
      </TableCell>
      <TableCell title={`Median Token Per Second: ${data.results.metrics.token_speed.median.toFixed(2)}`}>
        <span className={`font-mono ${isNested ? 'text-xs text-muted-foreground' : 'text-sm'}`}>
          {data.results.metrics.token_speed.median.toFixed(2)}
        </span>
      </TableCell>
      <TableCell title={`Median Time To First Token: ${data.results.metrics.time_to_first_token.median.toFixed(2)}ms`}>
        <span className={`font-mono ${isNested ? 'text-xs text-muted-foreground' : 'text-sm'}`}>
          {data.results.metrics.time_to_first_token.median.toFixed(2)}ms
        </span>
      </TableCell>
      <TableCell title={data.results?.configuration?.notes || (data as any).notes || undefined}>
        <span className={`text-sm truncate block max-w-[220px] ${isNested ? 'text-xs text-muted-foreground' : ''}`}>
          {data.results?.configuration?.notes || (data as any).notes || "-"}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFavorite(data.id, data.favorite || false);
          }}
          disabled={updatingFavorites.has(data.id)}
        >
          <Star 
            className={`h-4 w-4 ${
              data.favorite 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-400 hover:text-yellow-500'
            }`} 
          />
        </Button>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        <span className={isNested ? 'text-xs' : 'text-sm'}>
          {formatDate(data.createdAt)}
        </span>
      </TableCell>
      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="top" align="end" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => openEditNotes(data)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit notes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600"
                    onClick={() => openDelete(data)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    </TableRow>
  );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Model Benchmarks</CardTitle>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {favoritesFiltered.length} of {allGroupedModels.length} models
          </Badge>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            className="ml-2"
            onClick={() => setShowFavoritesOnly(v => !v)}
          >
            <Star className={`h-4 w-4 mr-1 ${showFavoritesOnly ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            Favorites
          </Button>
        </div>
        
        {/* Search Bar and Items Per Page */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Central dialog for edit/delete */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'edit' ? 'Edit Notes' : 'Confirm Delete'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'edit'
                  ? 'Update notes for this benchmark.'
                  : 'This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            {dialogMode === 'edit' && (
              <div className="mt-2">
                <Input
                  value={editNotesValue}
                  onChange={(e) => setEditNotesValue(e.target.value)}
                  placeholder="Enter notes"
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button variant={dialogMode === 'delete' ? 'destructive' : 'default'} onClick={confirmDialog}>
                {dialogMode === 'edit' ? 'Save' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Model Name</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Dataset</TableHead>
                <TableHead title="Median Token Per Second">Token/s</TableHead>
                <TableHead title="Median Time To First Token">TTFT</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[50px]">Favorite</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading benchmarks...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    <div className="text-red-500">
                      Error: {error}
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    {searchTerm ? "No models match your search." : "No benchmark data available."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedModels.map(({ model, latestData, hasMultipleVersions, allVersions }) => (
                  <>
                    <TableRow
                      key={model}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedBenchmark?.id === latestData.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleBenchmarkClick(latestData)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {hasMultipleVersions && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(model);
                              }}
                            >
                              {expandedRows.has(model) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <span className="truncate max-w-[230px]" title={model}>
                            {model}
                          </span>
                          {hasMultipleVersions && (
                            <Badge variant="secondary" className="text-xs">
                              {allVersions.length} versions
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{latestData.user}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{latestData.duration}s</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{latestData.dataset}</span>
                      </TableCell>
                      <TableCell title={`Median Token Per Second: ${latestData.results.metrics.token_speed.median.toFixed(2)}`}>
                        <span className="font-mono text-sm">
                          {latestData.results.metrics.token_speed.median.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell title={`Median Time To First Token: ${latestData.results.metrics.time_to_first_token.median.toFixed(2)}ms`}>
                        <span className="font-mono text-sm">
                          {latestData.results.metrics.time_to_first_token.median.toFixed(2)}ms
                        </span>
                      </TableCell>
                      <TableCell title={latestData.results?.configuration?.notes || (latestData as any).notes || undefined}>
                        <span className="text-sm truncate block max-w-[220px]">
                          {latestData.results?.configuration?.notes || (latestData as any).notes || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(latestData.id, latestData.favorite || false);
                          }}
                          disabled={updatingFavorites.has(latestData.id)}
                        >
                          <Star 
                            className={`h-4 w-4 ${
                              latestData.favorite 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-gray-400 hover:text-yellow-500'
                            }`} 
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(latestData.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" side="top" align="end" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => openEditNotes(latestData)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit notes</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600"
                                    onClick={() => openDelete(latestData)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                    
                    {hasMultipleVersions && expandedRows.has(model) && 
                      allVersions.slice(1).map((version) => (
                        <ModelRow
                          key={`${model}-${version.id}`}
                          data={version}
                          isNested={true}
                          isLatest={false}
                        />
                      ))
                    }
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredModels.length)} of {filteredModels.length} models
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and pages around current
                    return page === 1 || page === totalPages || 
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, visiblePages) => (
                    <>
                      {/* Add ellipsis before current section */}
                      {index > 0 && page - visiblePages[index - 1] > 1 && (
                        <span key={`ellipsis-${page}`} className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </>
                  ))
                }
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="pt-2 text-sm text-muted-foreground">
          <p>Click on a model name to view detailed benchmark results. Expand rows to see older versions.</p>
        </div>
      </CardContent>
    </Card>
  );
}