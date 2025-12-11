import { cn } from "@/lib/utils";
import { Check, Loader2, FileText, Scissors, Database, Sparkles, Shield } from "lucide-react";

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
}

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  currentStep: number;
  documentName: string;
}

const stepIcons = {
  upload: Shield,
  extract: FileText,
  chunk: Scissors,
  embed: Database,
  index: Sparkles,
};

export const ProcessingStatus = ({
  steps,
  currentStep,
  documentName,
}: ProcessingStatusProps) => {
  return (
    <div className="w-full max-w-sm mx-auto animate-in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center mx-auto mb-3">
          <Loader2 className="h-5 w-5 text-foreground animate-spin" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">Processing</h3>
        <p className="text-xs text-muted-foreground truncate max-w-[250px] mx-auto">{documentName}</p>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((step, index) => {
          const Icon = stepIcons[step.id as keyof typeof stepIcons] || FileText;
          const isActive = index === currentStep;
          const isCompleted = step.status === "completed";
          const isPending = step.status === "pending";

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150",
                isActive && "bg-secondary"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center transition-colors",
                isCompleted && "bg-success/10 text-success",
                isActive && "bg-foreground text-background",
                isPending && "bg-secondary text-muted-foreground"
              )}>
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm transition-colors",
                  (isActive || isCompleted) ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </p>
              </div>

              {/* Status */}
              {isCompleted && (
                <span className="text-[10px] text-success uppercase tracking-wider">Done</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mt-4 text-center">
        <div className="h-0.5 rounded-full bg-secondary overflow-hidden max-w-[200px] mx-auto">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
};
