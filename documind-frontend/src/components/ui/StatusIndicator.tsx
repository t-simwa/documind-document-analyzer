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
        "flex flex-col gap-1.5 px-3 py-2 rounded-lg border",
        status === "loading" && "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]",
        status === "error" && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
        status === "success" && "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]",
        status === "info" && "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {isAnimated ? (
          <Icon className={cn("h-3 w-3 animate-spin", status === "error" ? "text-red-600 dark:text-red-400" : "text-[#737373] dark:text-[#a3a3a3]")} />
        ) : (
          <Icon className={cn("h-3 w-3", status === "error" ? "text-red-600 dark:text-red-400" : "text-[#737373] dark:text-[#a3a3a3]")} />
        )}
        <span className={cn("text-xs font-medium flex-1", status === "error" ? "text-red-600 dark:text-red-400" : "text-[#171717] dark:text-[#fafafa]")}>
          {message}
        </span>
        {showTimeRemaining && (
          <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] tabular-nums">
            ~{estimatedTimeRemaining}s
          </span>
        )}
      </div>
      {showProgress && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1" />
          <div className="flex items-center justify-between text-[10px] text-[#737373] dark:text-[#a3a3a3]">
            <span>Processing...</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

