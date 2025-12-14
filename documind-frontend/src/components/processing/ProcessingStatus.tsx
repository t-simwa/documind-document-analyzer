import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import type { SecurityScanResult, OCRStatus, ProcessingError } from "@/types/api";
import { SecurityScanResults } from "@/components/security/SecurityScanResults";
import {
  UploadStepIcon,
  SecurityScanStepIcon,
  ExtractStepIcon,
  OCRStepIcon,
  ChunkStepIcon,
  EmbedStepIcon,
  IndexStepIcon,
  ProcessingSpinnerIcon,
  CheckCompleteIcon,
  ErrorIcon,
} from "./ProcessingIcons";

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
  securityScan?: SecurityScanResult;
  ocrStatus?: OCRStatus;
  processingError?: ProcessingError;
  onRetry?: () => void;
}

const stepIcons = {
  upload: UploadStepIcon,
  security_scan: SecurityScanStepIcon,
  extract: ExtractStepIcon,
  ocr: OCRStepIcon,
  chunk: ChunkStepIcon,
  embed: EmbedStepIcon,
  index: IndexStepIcon,
};

export const ProcessingStatus = ({
  steps,
  currentStep,
  documentName,
  securityScan,
  ocrStatus,
  processingError,
  onRetry,
}: ProcessingStatusProps) => {
  const securityScanStep = steps.find(step => step.id === "security_scan");
  const progressPercentage = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="w-full max-w-lg mx-auto animate-in">
      {/* Main Card */}
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-3 py-2 border-b border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center flex-shrink-0">
              <ProcessingSpinnerIcon className="h-4 w-4 text-[#171717] dark:text-[#fafafa]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[12px] font-semibold text-[#171717] dark:text-[#fafafa] leading-tight">
                Processing Document
              </h3>
              <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] truncate mt-0.5">
                {documentName}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] leading-none">
                {progressPercentage}%
              </div>
              <div className="text-[9px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                {currentStep + 1}/{steps.length}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Security Scan Results */}
          {securityScan && securityScanStep && (
            <div>
              <SecurityScanResults scanResult={securityScan} />
            </div>
          )}

          {/* Processing Error */}
          {processingError && (
            <div className="p-2 rounded-md border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ErrorIcon className="h-3 w-3 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-red-900 dark:text-red-100 mb-0.5">
                    Processing Error
                  </p>
                  <p className="text-[10px] text-red-700 dark:text-red-300/80 mb-1.5">
                    {processingError.message}
                  </p>
                  {processingError.recoverable && onRetry && (
                    <button
                      onClick={onRetry}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Processing Steps */}
          <div className="space-y-1">
            {steps.map((step, index) => {
              const Icon = stepIcons[step.id as keyof typeof stepIcons] || ExtractStepIcon;
              const isActive = index === currentStep;
              const isCompleted = step.status === "completed";
              const isPending = step.status === "pending";
              const hasError = step.status === "error";
              const showOCRProgress = step.id === "ocr" && ocrStatus && ocrStatus.status === "processing";

              return (
                <div
                  key={step.id}
                  className={cn(
                    "group relative p-2 rounded-md border transition-all duration-200",
                    isActive && "border-[#0071ce] dark:border-[#0071ce] bg-[#f0f7ff] dark:bg-[#0071ce]/10",
                    isCompleted && "border-[#10b981] dark:border-[#10b981]/30 bg-[#f0fdf4] dark:bg-[#10b981]/5",
                    hasError && "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20",
                    !isActive && !isCompleted && !hasError && "border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {/* Icon */}
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200",
                      isCompleted && "bg-[#10b981] dark:bg-[#10b981]/20 text-[#10b981] dark:text-[#10b981]",
                      isActive && "bg-[#0071ce] dark:bg-[#0071ce] text-white",
                      hasError && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
                      isPending && "bg-[#f5f5f5] dark:bg-[#262626] text-[#737373] dark:text-[#a3a3a3]"
                    )}>
                      {isCompleted ? (
                        <CheckCompleteIcon className="h-3.5 w-3.5" />
                      ) : isActive ? (
                        <ProcessingSpinnerIcon className="h-3.5 w-3.5" />
                      ) : hasError ? (
                        <ErrorIcon className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-[11px] font-medium transition-colors leading-tight",
                          (isActive || isCompleted) ? "text-[#171717] dark:text-[#fafafa]" : "text-[#737373] dark:text-[#a3a3a3]",
                          hasError && "text-red-900 dark:text-red-100"
                        )}>
                          {step.label}
                        </p>
                        {isCompleted && (
                          <span className="text-[9px] font-medium text-[#10b981] dark:text-[#10b981] uppercase tracking-wider flex-shrink-0">
                            Done
                          </span>
                        )}
                        {hasError && (
                          <span className="text-[9px] font-medium text-red-600 dark:text-red-400 uppercase tracking-wider flex-shrink-0">
                            Error
                          </span>
                        )}
                      </div>
                      {showOCRProgress && ocrStatus && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                              Page {ocrStatus.pagesProcessed}/{ocrStatus.totalPages}
                            </span>
                            <span className="text-[10px] font-medium text-[#171717] dark:text-[#fafafa]">
                              {ocrStatus.progress}%
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-[#e5e5e5] dark:bg-[#262626] overflow-hidden">
                            <div
                              className="h-full bg-[#0071ce] dark:bg-[#0071ce] transition-all duration-300 rounded-full"
                              style={{ width: `${ocrStatus.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Progress Bar */}
          <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-[#171717] dark:text-[#fafafa]">
                Overall Progress
              </span>
              <span className="text-[11px] font-semibold text-[#171717] dark:text-[#fafafa]">
                {progressPercentage}%
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-[#e5e5e5] dark:bg-[#262626] overflow-hidden">
              <div
                className="h-full bg-[#0071ce] dark:bg-[#0071ce] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
