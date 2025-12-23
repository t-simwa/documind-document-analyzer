import { useState } from "react";
import { FileText, AlertCircle, Clock, Download, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { ExportDialog } from "@/components/sharing/ExportDialog";
import type { DocumentSummary } from "@/types/api";

interface SummaryTabProps {
  documentId?: string;
  documentName?: string;
  summary: DocumentSummary | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const SummaryTab = ({ documentId, documentName, summary, isLoading, error, onRetry }: SummaryTabProps) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 w-full space-y-6">
          {/* Status Indicator */}
          <StatusIndicator
            status="loading"
            message="Generating summary..."
            progress={undefined}
            className="mb-2"
          />
          
          {/* Loading Skeletons */}
          <div className="space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-6 w-56" />
              <div className="space-y-2.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-4 w-4 rounded-sm flex-shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 w-full">
          <StatusIndicator
            status="error"
            message="Unable to load summary"
            onRetry={onRetry}
            className="mb-4"
          />
          <div className="text-center py-8">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-4">{error}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5 h-7 text-xs border-[#e5e5e5] dark:border-[#262626]"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div className="w-8 h-8 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center mb-3">
          <FileText className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
        </div>
        <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-1">Summary not available</h3>
        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] text-center max-w-sm">
          The summary will be generated automatically once document processing is complete.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Header with Export */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Summary</h2>
            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
              Overview of key information extracted from this document
            </p>
          </div>
          {summary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
              className="gap-1.5 h-7 text-xs border-[#e5e5e5] dark:border-[#262626]"
            >
              <Download className="h-3 w-3" />
              Export
            </Button>
          )}
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          
          <div className="prose prose-sm max-w-none">
            <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-4">
              <p className="text-xs leading-relaxed text-[#171717] dark:text-[#fafafa] font-normal whitespace-pre-wrap">
                {summary.executiveSummary}
              </p>
              {summary.generatedAt && (
                <div className="mt-4 pt-3 border-t border-[#e5e5e5] dark:border-[#262626] flex items-center gap-1.5">
                  <Clock className="h-2.5 w-2.5 text-[#737373] dark:text-[#a3a3a3]" />
                  <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] font-medium">
                    Generated {summary.generatedAt.toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric", 
                      year: "numeric" 
                    })} at {summary.generatedAt.toLocaleTimeString("en-US", { 
                      hour: "numeric", 
                      minute: "2-digit",
                      hour12: true 
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Points */}
        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Key Points</h3>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                Important highlights and findings
              </p>
            </div>
            
            <div className="space-y-2">
              {summary.keyPoints.map((point, index) => (
                <div 
                  key={index} 
                  className="group flex gap-2 p-2.5 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-4 h-4 rounded border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center mt-0.5 group-hover:border-[#171717]/20 dark:group-hover:border-[#fafafa]/20 transition-colors">
                    <span className="text-[9px] font-medium text-[#737373] dark:text-[#a3a3a3] group-hover:text-[#171717] dark:group-hover:text-[#fafafa]">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-xs text-[#171717] dark:text-[#fafafa] flex-1 leading-relaxed font-normal pt-0.5">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        documentId={documentId}
        documentName={documentName}
        summary={summary || undefined}
      />
    </div>
  );
};

