import { cn } from "@/lib/utils";
import type { SecurityScanResult } from "@/types/api";
import {
  SecurityCleanIcon,
  SecurityThreatIcon,
  SecurityScanningIcon,
  SecurityErrorIcon,
  SecurityPendingIcon,
  MalwareIcon,
  VirusIcon,
  ThreatAlertIcon,
} from "./SecurityIcons";

interface SecurityScanResultsProps {
  scanResult: SecurityScanResult;
  className?: string;
}

export const SecurityScanResults = ({ scanResult, className }: SecurityScanResultsProps) => {
  const getStatusIcon = (status: SecurityScanResult["status"]) => {
    switch (status) {
      case "clean":
        return <SecurityCleanIcon className="h-4 w-4 text-[#10b981] dark:text-[#10b981]" />;
      case "threat_detected":
        return <SecurityThreatIcon className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "scanning":
        return <SecurityScanningIcon className="h-4 w-4 text-[#171717] dark:text-[#fafafa]" />;
      case "error":
        return <SecurityErrorIcon className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <SecurityPendingIcon className="h-4 w-4 text-[#737373] dark:text-[#a3a3a3]" />;
    }
  };

  const getStatusText = (status: SecurityScanResult["status"]) => {
    switch (status) {
      case "clean":
        return "Secure";
      case "threat_detected":
        return "Threat Detected";
      case "scanning":
        return "Scanning...";
      case "error":
        return "Scan Error";
      default:
        return "Pending";
    }
  };

  const getStatusColor = (status: SecurityScanResult["status"]) => {
    switch (status) {
      case "clean":
        return "border-[#10b981] dark:border-[#10b981]/30 bg-[#f0fdf4] dark:bg-[#10b981]/5 text-[#10b981] dark:text-[#10b981]";
      case "threat_detected":
        return "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-100";
      case "scanning":
        return "border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50 text-[#171717] dark:text-[#fafafa]";
      case "error":
        return "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-100";
      default:
        return "border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50 text-[#737373] dark:text-[#a3a3a3]";
    }
  };

  const getThreatSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-300 dark:border-red-800/40 bg-red-100/50 dark:bg-red-950/30 text-red-900 dark:text-red-100";
      case "high":
        return "border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-100";
      case "medium":
        return "border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-900 dark:text-yellow-100";
      case "low":
        return "border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100";
      default:
        return "border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50 text-[#737373] dark:text-[#a3a3a3]";
    }
  };

  const allThreats = [
    ...(scanResult.malwareScan?.threats || []),
    ...(scanResult.virusScan?.threats || []),
  ];

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Overall Status Card */}
      <div className={cn(
        "p-1.5 rounded-md border",
        getStatusColor(scanResult.status)
      )}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-white/50 dark:bg-[#171717]/50 flex items-center justify-center flex-shrink-0">
            {getStatusIcon(scanResult.status)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium leading-tight">{getStatusText(scanResult.status)}</p>
            {scanResult.scannedAt && (
              <p className="text-[9px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                {new Date(scanResult.scannedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scan Details */}
      <div className="grid grid-cols-2 gap-1">
        {/* Malware Scan */}
        {scanResult.malwareScan && (
          <div className="p-1.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-md bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                  <MalwareIcon className="h-2.5 w-2.5 text-[#737373] dark:text-[#a3a3a3]" />
                </div>
                <span className="text-[9px] font-medium text-[#171717] dark:text-[#fafafa]">Malware</span>
              </div>
              {scanResult.malwareScan.status === "clean" && (
                <SecurityCleanIcon className="h-2.5 w-2.5 text-[#10b981] dark:text-[#10b981]" />
              )}
              {scanResult.malwareScan.status === "threat_detected" && (
                <ThreatAlertIcon className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
              )}
              {scanResult.malwareScan.status === "scanning" && (
                <SecurityScanningIcon className="h-2.5 w-2.5 text-[#171717] dark:text-[#fafafa]" />
              )}
            </div>
            {scanResult.malwareScan.scannedAt && (
              <p className="text-[8px] text-[#737373] dark:text-[#a3a3a3]">
                {new Date(scanResult.malwareScan.scannedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* Virus Scan */}
        {scanResult.virusScan && (
          <div className="p-1.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-md bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                  <VirusIcon className="h-2.5 w-2.5 text-[#737373] dark:text-[#a3a3a3]" />
                </div>
                <span className="text-[9px] font-medium text-[#171717] dark:text-[#fafafa]">Virus</span>
              </div>
              {scanResult.virusScan.status === "clean" && (
                <SecurityCleanIcon className="h-2.5 w-2.5 text-[#10b981] dark:text-[#10b981]" />
              )}
              {scanResult.virusScan.status === "threat_detected" && (
                <ThreatAlertIcon className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
              )}
              {scanResult.virusScan.status === "scanning" && (
                <SecurityScanningIcon className="h-2.5 w-2.5 text-[#171717] dark:text-[#fafafa]" />
              )}
            </div>
            {scanResult.virusScan.scannedAt && (
              <p className="text-[8px] text-[#737373] dark:text-[#a3a3a3]">
                {new Date(scanResult.virusScan.scannedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Threats List */}
      {allThreats.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-[#171717] dark:text-[#fafafa]">Detected Threats</p>
          {allThreats.map((threat, index) => (
            <div
              key={index}
              className={cn(
                "p-1.5 rounded-md border",
                getThreatSeverityColor(threat.severity)
              )}
            >
              <div className="flex items-start gap-1">
                <div className="w-4 h-4 rounded-md bg-white/50 dark:bg-[#171717]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ThreatAlertIcon className="h-2.5 w-2.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-medium mb-0.5 leading-tight">{threat.name}</p>
                  <p className="text-[8px] text-[#737373] dark:text-[#a3a3a3] mb-1 leading-tight">
                    {threat.description}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-[8px] px-1 py-0.5 rounded-md font-medium uppercase tracking-wider",
                      getThreatSeverityColor(threat.severity)
                    )}>
                      {threat.severity}
                    </span>
                    <span className="text-[8px] text-[#737373] dark:text-[#a3a3a3]">
                      {threat.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {scanResult.error && (
        <div className="p-1.5 rounded-md border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <SecurityErrorIcon className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-[9px] text-red-900 dark:text-red-100 leading-tight">{scanResult.error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

