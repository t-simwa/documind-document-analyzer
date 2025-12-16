import { Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type StatusType = "loading" | "error" | "success" | "info";

interface StatusIndicatorProps {
  status: StatusType;
  message: string;
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  onRetry?: () => void;
  className?: string;
}

export const StatusIndicator = ({
  status,
  message,
  progress,
  estimatedTimeRemaining,
  onRetry,
  className,
}: StatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "loading":
        return {
          icon: Loader2,
          color: "text-foreground",
          bgColor: "bg-muted/30",
          borderColor: "border-border/50",
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20",
        };
      case "success":
        return {
          icon: CheckCircle,
          color: "text-foreground",
          bgColor: "bg-muted/30",
          borderColor: "border-border/50",
        };
      case "info":
        return {
          icon: Info,
          color: "text-foreground",
          bgColor: "bg-muted/30",
          borderColor: "border-border/50",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isAnimated = status === "loading";
  const showProgress = status === "loading" && progress !== undefined;
  const showTimeRemaining = showProgress && estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-4 py-3 rounded-lg border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isAnimated ? (
          <Icon className={cn("h-4 w-4 animate-spin", config.color)} />
        ) : (
          <Icon className={cn("h-4 w-4", config.color)} />
        )}
        <span className={cn("text-sm font-medium flex-1", status === "error" ? config.color : "text-foreground")}>
          {message}
        </span>
        {showTimeRemaining && (
          <span className="text-xs text-muted-foreground tabular-nums">
            ~{estimatedTimeRemaining}s
          </span>
        )}
      </div>
      {showProgress && (
        <div className="space-y-1.5">
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Processing...</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

