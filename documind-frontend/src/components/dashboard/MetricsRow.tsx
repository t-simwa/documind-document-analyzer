import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { metricsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { documentsApi } from "@/services/api";

interface MetricCard {
  label: string;
  value: string;
  accentColor: string;
}

export function MetricsRow() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch document and storage metrics
      const [docMetrics, storageMetrics, allDocuments] = await Promise.all([
        metricsApi.getDocumentMetrics(),
        metricsApi.getStorageMetrics(),
        documentsApi.list({ limit: 1000 }).catch(() => ({ documents: [], total: 0 }))
      ]);
      
      // Calculate query metrics (mock for now - would need query history API)
      const totalQueries = 0; // TODO: Get from query history API
      const successfulQueries = 0; // TODO: Get from query history API
      const successRate = totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0;
      
      // Calculate queue status
      const processingDocs = allDocuments.documents.filter(d => d.status === "processing");
      const queuedDocs = allDocuments.documents.filter(d => d.status === "queued");
      const queueTotal = processingDocs.length + queuedDocs.length;
      
      // Build metrics
      const totalDocs = docMetrics.totalDocuments || 0;
      const storageUsed = storageMetrics.storage.usedGb;
      const storageLimit = storageMetrics.storage.limitGb;
      const storagePercentage = storageMetrics.storage.percentage;
      
      setMetrics([
        {
          label: "Documents",
          value: totalDocs.toLocaleString(),
          accentColor: "text-blue-500"
        },
        {
          label: "Storage",
          value: `${storageUsed.toFixed(1)} / ${storageLimit} GB`,
          accentColor: storagePercentage > 80 ? "text-amber-500" : "text-indigo-500"
        },
        {
          label: "Queries",
          value: totalQueries.toLocaleString(),
          accentColor: "text-purple-500"
        },
        {
          label: "Success Rate",
          value: `${successRate.toFixed(1)}%`,
          accentColor: successRate >= 95 ? "text-emerald-500" : successRate >= 80 ? "text-amber-500" : "text-rose-500"
        },
        {
          label: "Queue",
          value: queueTotal > 0 ? `${queueTotal} active` : "Empty",
          accentColor: queueTotal > 0 ? "text-amber-500" : "text-emerald-500"
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load metrics",
        variant: "destructive",
      });
      // Set default metrics on error
      setMetrics([
        {
          label: "Documents",
          value: "0",
          accentColor: "text-blue-500"
        },
        {
          label: "Storage",
          value: "0 / 10 GB",
          accentColor: "text-indigo-500"
        },
        {
          label: "Queries",
          value: "0",
          accentColor: "text-purple-500"
        },
        {
          label: "Success Rate",
          value: "0%",
          accentColor: "text-gray-500"
        },
        {
          label: "Queue",
          value: "Empty",
          accentColor: "text-emerald-500"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-[#e5e5e5] dark:bg-[#262626] rounded w-20 mb-2"></div>
                <div className="h-5 bg-[#e5e5e5] dark:bg-[#262626] rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg mb-6">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e5e5] dark:divide-[#262626]">
          {metrics.map((metric, index) => {
            return (
              <div
                key={index}
                className={cn(
                  "px-4 py-2 sm:py-0",
                  index === 0 && "pt-0",
                  index === metrics.length - 1 && "pb-0",
                  "sm:first:pl-0 sm:last:pr-0"
                )}
              >
                {/* Label */}
                <p className={cn(
                  "text-[10px] font-medium uppercase tracking-wide mb-2",
                  "text-[#737373] dark:text-[#a3a3a3]"
                )}>
                  {metric.label}
                </p>

                {/* Value */}
                <p className={cn(
                  "text-base font-semibold leading-none",
                  "text-[#171717] dark:text-[#fafafa]"
                )}>
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
