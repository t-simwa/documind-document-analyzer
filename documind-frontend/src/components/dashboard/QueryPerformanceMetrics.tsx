import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZapIcon, ClockIcon } from "./DashboardIcons";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryApi } from "@/services/api";

interface QueryPerformance {
  successRate: number;
  averageResponseTime: number;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  topQueries: Array<{
    query: string;
    count: number;
    avgTime: number;
  }>;
  recentErrors: Array<{
    query: string;
    error: string;
    timestamp: string;
  }>;
}

export function QueryPerformanceMetrics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [performance, setPerformance] = useState<QueryPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
    
    // Refresh performance metrics every 30 seconds
    const interval = setInterval(fetchPerformance, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      
      const data = await queryApi.getPerformance();
      
      // Map backend response to component format
      const performance: QueryPerformance = {
        successRate: data.success_rate,
        averageResponseTime: data.average_response_time,
        totalQueries: data.total_queries,
        successfulQueries: data.successful_queries,
        failedQueries: data.failed_queries,
        topQueries: data.top_queries.map(q => ({
          query: q.query,
          count: q.count,
          avgTime: q.avg_time
        })),
        recentErrors: data.recent_errors.map(e => ({
          query: e.query,
          error: e.error,
          timestamp: e.timestamp
        }))
      };
      
      setPerformance(performance);
    } catch (error) {
      console.error("Failed to fetch query performance:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load query performance metrics",
        variant: "destructive",
      });
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Query Performance
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!performance) {
    return null;
  }

  const successColor = performance.successRate >= 95 
    ? "text-emerald-500" 
    : performance.successRate >= 80 
    ? "text-amber-500" 
    : "text-rose-500";

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
          Query Performance
        </h2>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]">
              <div className="flex items-center gap-1.5 mb-1">
                <ZapIcon className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wide">
                  Success Rate
                </span>
              </div>
              <p className={cn("text-base font-semibold leading-none", successColor)}>
                {performance.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-2.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]">
              <div className="flex items-center gap-1.5 mb-1">
                <ClockIcon className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wide">
                  Avg. Response
                </span>
              </div>
              <p className="text-base font-semibold text-[#171717] dark:text-[#fafafa] leading-none">
                {performance.averageResponseTime.toFixed(1)}s
              </p>
            </div>
          </div>

          {/* Query Counts */}
          {performance.totalQueries > 0 && (
            <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#fafafa]">
                    {performance.totalQueries}
                  </p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-emerald-500">
                    {performance.successfulQueries}
                  </p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Success</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-rose-500">
                    {performance.failedQueries}
                  </p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Failed</p>
                </div>
              </div>
            </div>
          )}

          {/* Top Queries */}
          {performance.topQueries.length > 0 && (
            <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                  Most Common Queries
                </span>
                <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                  This Week
                </Badge>
              </div>
              <div className="space-y-1.5">
                {performance.topQueries.slice(0, 3).map((query, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-[#171717] dark:text-[#fafafa] truncate flex-1">
                        {query.query}
                      </p>
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px] ml-2">
                        {query.count}x
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                        {query.avgTime.toFixed(1)}s avg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Errors */}
          {performance.recentErrors.length > 0 && (
            <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                  Recent Errors
                </span>
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                  {performance.recentErrors.length}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {performance.recentErrors.slice(0, 2).map((error, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-md border border-rose-500/20 bg-rose-500/5"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#171717] dark:text-[#fafafa] truncate mb-0.5">
                          {error.query}
                        </p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400">
                          {error.error}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {performance.totalQueries === 0 && (
            <div className="text-center py-4">
              <ZapIcon className="h-6 w-6 text-[#737373] dark:text-[#a3a3a3] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">
                No queries yet
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app/documents")}
                className="h-6 px-2 text-xs"
              >
                Start Querying
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
