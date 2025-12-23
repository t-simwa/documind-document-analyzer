import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClockIcon } from "./DashboardIcons";
import { CheckCircle, RefreshCw } from "lucide-react";
import { documentsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface ProcessingQueue {
  active: number;
  queued: number;
  completed: number;
  failed: number;
  averageTime: number;
  documents: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    startedAt?: string;
  }>;
}

export function ProcessingStatusWidget() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [queue, setQueue] = useState<ProcessingQueue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueueStatus();
    // Refresh every 10 seconds
    const interval = setInterval(fetchQueueStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch all documents to calculate queue status
      const documents = await documentsApi.list({ limit: 1000 });
      
      const processingDocs = documents.documents.filter(d => d.status === "processing");
      const queuedDocs = documents.documents.filter(d => d.status === "queued");
      const completedDocs = documents.documents.filter(d => d.status === "ready");
      const failedDocs = documents.documents.filter(d => d.status === "error");
      
      // Calculate average processing time (mock for now)
      const averageTime = 2.5; // minutes
      
      // Get active documents with progress
      const activeDocuments = processingDocs.slice(0, 3).map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        progress: 50, // Mock progress - would come from processing status
        startedAt: doc.uploaded_at
      }));
      
      setQueue({
        active: processingDocs.length,
        queued: queuedDocs.length,
        completed: completedDocs.length,
        failed: failedDocs.length,
        averageTime,
        documents: activeDocuments
      });
    } catch (error) {
      console.error("Failed to fetch queue status:", error);
      toast({
        title: "Error",
        description: "Failed to load processing queue",
        variant: "destructive",
      });
      setQueue(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !queue) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Processing Queue
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!queue) {
    return null;
  }

  const totalInQueue = queue.active + queue.queued;
  const hasActiveProcessing = queue.active > 0 || queue.queued > 0;

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Processing Queue
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQueueStatus}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {/* Queue Summary */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-center">
              <p className="text-sm font-semibold text-[#171717] dark:text-[#fafafa] leading-none">
                {queue.active}
              </p>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                Active
              </p>
            </div>
            <div className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-center">
              <p className="text-sm font-semibold text-amber-500 leading-none">
                {queue.queued}
              </p>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                Queued
              </p>
            </div>
            <div className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-center">
              <p className="text-sm font-semibold text-emerald-500 leading-none">
                {queue.completed}
              </p>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                Done
              </p>
            </div>
            <div className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-center">
              <p className="text-sm font-semibold text-rose-500 leading-none">
                {queue.failed}
              </p>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                Failed
              </p>
            </div>
          </div>

          {/* Active Processing */}
          {hasActiveProcessing && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                  Currently Processing
                </span>
                <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                  {totalInQueue} total
                </Badge>
              </div>
              <div className="space-y-2">
                {queue.documents.length > 0 ? (
                  queue.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] truncate flex-1">
                          {doc.name}
                        </p>
                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] ml-2">
                          {doc.progress}%
                        </span>
                      </div>
                      <Progress 
                        value={doc.progress} 
                        className="h-1 bg-[#e5e5e5] dark:bg-[#262626] [&>div]:bg-blue-500" 
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                      No active processing
                    </p>
                  </div>
                )}
                {queue.active > queue.documents.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/app/documents?status=processing")}
                    className="w-full h-6 text-xs"
                  >
                    View All ({queue.active} active)
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Average Processing Time */}
          {hasActiveProcessing && (
            <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
                  <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                    Avg. processing time
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#171717] dark:text-[#fafafa]">
                  {queue.averageTime.toFixed(1)} min
                </span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasActiveProcessing && (
            <div className="text-center py-4">
              <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                Queue is empty
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
