import { Loader2, Search, Sparkles, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueryStatus } from "@/types/api";

interface QueryStatusIndicatorProps {
  status: QueryStatus;
  onCancel?: () => void;
}

export const QueryStatusIndicator = ({
  status,
  onCancel,
}: QueryStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "retrieving":
        return {
          icon: Search,
          text: "Retrieving relevant sections...",
          color: "text-blue-500",
        };
      case "generating":
        return {
          icon: Sparkles,
          text: "Generating answer...",
          color: "text-purple-500",
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Error occurred",
          color: "text-red-500",
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

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
      {isAnimated ? (
        <Loader2 className={cn("h-3.5 w-3.5 animate-spin", config.color)} />
      ) : (
        <Icon className={cn("h-3.5 w-3.5", config.color)} />
      )}
      <span className={cn("text-xs font-medium", config.color)}>
        {config.text}
      </span>
      {onCancel && isAnimated && (
        <button
          onClick={onCancel}
          className="ml-auto p-1 rounded hover:bg-muted/50 transition-colors"
          aria-label="Cancel query"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
};

