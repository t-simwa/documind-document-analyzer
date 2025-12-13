import { FileText, AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentSummary } from "@/types/api";

interface SummaryTabProps {
  summary: DocumentSummary | null;
  isLoading?: boolean;
  error?: string | null;
}

export const SummaryTab = ({ summary, isLoading, error }: SummaryTabProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 w-full">
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
      <div className="flex flex-col items-center justify-center h-full px-6 py-16">
        <div className="w-10 h-10 rounded-lg bg-muted/80 flex items-center justify-center mb-4">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">Unable to load summary</h3>
        <p className="text-xs text-muted-foreground text-center max-w-sm">{error}</p>
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
        {/* Executive Summary */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Summary</h2>
            <p className="text-xs text-muted-foreground">
              Overview of key information extracted from this document
            </p>
          </div>
          
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
    </div>
  );
};

