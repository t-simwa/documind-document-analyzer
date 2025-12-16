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
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
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
      <div className="flex flex-col items-center justify-center h-full px-6 py-16">
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">Summary not available</h3>
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          The summary will be generated automatically once document processing is complete.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 w-full space-y-8">
        {/* Header with Export */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Summary</h2>
            <p className="text-xs text-muted-foreground">
              Overview of key information extracted from this document
            </p>
          </div>
          {summary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>

        {/* Executive Summary */}
        <div className="space-y-4">
          
          <div className="prose prose-sm max-w-none">
            <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
              <p className="text-xs leading-relaxed text-foreground/90 font-normal whitespace-pre-wrap">
                {summary.executiveSummary}
              </p>
              {summary.generatedAt && (
                <div className="mt-6 pt-5 border-t border-border/50 flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground font-medium">
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
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h3 className="text-base font-semibold tracking-tight text-foreground">Key Points</h3>
              <p className="text-xs text-muted-foreground">
                Important highlights and findings
              </p>
            </div>
            
            <div className="space-y-2.5">
              {summary.keyPoints.map((point, index) => (
                <div 
                  key={index} 
                  className="group flex gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded border border-border/60 bg-background flex items-center justify-center mt-0.5 group-hover:border-foreground/20 transition-colors">
                    <span className="text-[10px] font-semibold text-foreground/60 group-hover:text-foreground/80">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 flex-1 leading-relaxed font-normal pt-0.5">
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

