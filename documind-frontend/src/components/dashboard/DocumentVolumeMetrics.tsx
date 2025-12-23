import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FileTextIcon, TrendingUpIcon, TrendingDownIcon } from "./DashboardIcons";
import { metricsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { DocumentMetric } from "@/types/api";

interface Metric {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
}

const getTrendIcon = (trend: Metric["trend"]) => {
  switch (trend) {
    case "up":
      return <TrendingUpIcon className="h-3 w-3 text-green-500" />;
    case "down":
      return <TrendingDownIcon className="h-3 w-3 text-red-500" />;
    default:
      return <div className="h-3 w-3 border-t-2 border-[#737373] dark:border-[#a3a3a3]" />;
  }
};

const getTrendColor = (trend: Metric["trend"]) => {
  switch (trend) {
    case "up":
      return "text-green-500";
    case "down":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
};

export function DocumentVolumeMetrics() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(10);
  const [storagePercentage, setStoragePercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch both document and storage metrics
      const [docMetrics, storageMetrics] = await Promise.all([
        metricsApi.getDocumentMetrics(),
        metricsApi.getStorageMetrics(),
      ]);
      
      // Set document metrics
      setMetrics(docMetrics.metrics);
      
      // Set storage metrics
      setStorageUsed(storageMetrics.storage.usedGb);
      setStorageLimit(storageMetrics.storage.limitGb);
      setStoragePercentage(storageMetrics.storage.percentage);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load metrics",
        variant: "destructive",
      });
      // Set empty metrics on error
      setMetrics([]);
      setStorageUsed(0);
      setStorageLimit(10);
      setStoragePercentage(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
          Document Volume
        </h2>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
          </div>
        ) : (
          <>
        {/* Metrics Grid */}
        <div className="space-y-2 mb-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="p-2.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] font-medium block mb-1">
                    {metric.label}
                  </span>
                  <p className="text-base font-semibold text-[#171717] dark:text-[#fafafa] leading-none">
                    {metric.value}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {getTrendIcon(metric.trend)}
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      metric.trend === "up" && "text-green-500",
                      metric.trend === "down" && "text-red-500",
                      metric.trend === "neutral" && "text-[#737373] dark:text-[#a3a3a3]"
                    )}
                  >
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Storage Progress */}
        <div className="pt-3 border-t border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
              Storage
            </span>
            <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
              {storageUsed} / {storageLimit} GB
            </span>
          </div>
          <Progress 
            value={storagePercentage} 
            className="h-1.5 bg-[#f5f5f5] dark:bg-[#262626] rounded-full overflow-hidden [&>div]:bg-[#0071ce]" 
          />
        </div>
          </>
        )}
      </div>
    </div>
  );
}

