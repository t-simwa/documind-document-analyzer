import { Loader2, Search, Sparkles, AlertCircle, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { QueryStatus } from "@/types/api";

interface QueryStatusIndicatorProps {
  status: QueryStatus;
  onCancel?: () => void;
  error?: string;
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  phase?: "retrieving" | "generating";
}

export const QueryStatusIndicator = ({
  status,
  onCancel,
  error,
  progress,
  estimatedTimeRemaining,
  phase,
}: QueryStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "retrieving":
        return {
          icon: Search,
          text: "Retrieving relevant sections...",
          color: "text-foreground",
        };
      case "generating":
        return {
          icon: Sparkles,
          text: "Generating answer...",
          color: "text-foreground",
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Error occurred",
          color: "text-destructive",
        };
      case "cancelled":
        return {
          icon: X,
          text: "Query cancelled",
          color: "text-muted-foreground",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;
  const isAnimated = status === "retrieving" || status === "generating";

  const showProgress = (status === "retrieving" || status === "generating") && progress !== undefined;
  const showTimeRemaining = showProgress && estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0;

  return (
    <div className="flex flex-col gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        {isAnimated ? (
          <Loader2 className={cn("h-3.5 w-3.5 animate-spin", config.color)} />
        ) : (
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        )}
        <span className={cn("text-xs font-medium flex-1", config.color)}>
          {error || config.text}
        </span>
        {showTimeRemaining && (
          <span className="text-xs text-muted-foreground tabular-nums">
            ~{estimatedTimeRemaining}s
          </span>
        )}
        {onCancel && isAnimated && (
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-muted/50 transition-colors"
            aria-label="Cancel query"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      {showProgress && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          {phase && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="capitalize">{phase}...</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

