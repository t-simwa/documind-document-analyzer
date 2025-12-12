import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FileTextIcon, TrendingUpIcon, TrendingDownIcon } from "./DashboardIcons";

interface Metric {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
}

// Mock metrics data - replace with actual API call
const mockMetrics: Metric[] = [
  {
    label: "Total Documents",
    value: "1,247",
    change: 12.5,
    trend: "up",
  },
  {
    label: "Processed This Month",
    value: "342",
    change: 8.2,
    trend: "up",
  },
  {
    label: "Storage Used",
    value: "2.4 GB",
    change: -3.1,
    trend: "down",
  },
];

const getTrendIcon = (trend: Metric["trend"]) => {
  switch (trend) {
    case "up":
      return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
    case "down":
      return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
    default:
      return <div className="h-4 w-4 border-t-2 border-[#737373] dark:border-[#a3a3a3]" />;
  }
};

const getTrendColor = (trend: Metric["trend"]) => {
  switch (trend) {
    case "up":
      return "text-green-500";
    case "down":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
};

export function DocumentVolumeMetrics() {
  // TODO: Replace with actual API call
  const metrics = mockMetrics;
  const storageUsed = 2.4; // GB
  const storageLimit = 10; // GB
  const storagePercentage = (storageUsed / storageLimit) * 100;

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
          Document Volume
        </h2>
        <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
          Overview of your document metrics
        </p>
      </div>
      <div className="p-6">
        {/* Metrics Grid */}
        <div className="space-y-3 mb-6">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="group relative p-4 rounded-xl border border-[#f5f5f5] dark:border-[#262626] bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] hover:border-[#e5e5e5] dark:hover:border-[#404040] transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] text-[#737373] dark:text-[#a3a3a3] font-medium leading-tight block mb-2">
                    {metric.label}
                  </span>
                  <p className="text-2xl font-semibold text-[#171717] dark:text-[#fafafa] tracking-tight leading-none">
                    {metric.value}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {getTrendIcon(metric.trend)}
                  <span
                    className={cn(
                      "text-[12px] font-semibold whitespace-nowrap",
                      metric.trend === "up" && "text-green-500",
                      metric.trend === "down" && "text-red-500",
                      metric.trend === "neutral" && "text-[#737373] dark:text-[#a3a3a3]"
                    )}
                  >
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Storage Progress */}
        <div className="pt-5 border-t border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                <FileTextIcon className="h-4 w-4 text-[#737373] dark:text-[#a3a3a3]" />
              </div>
              <div>
                <span className="text-[13px] font-semibold text-[#171717] dark:text-[#fafafa] block leading-tight">
                  Storage Usage
                </span>
                <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-0.5 block">
                  {storagePercentage.toFixed(1)}% of limit used
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[14px] font-semibold text-[#171717] dark:text-[#fafafa] block leading-tight">
                {storageUsed} GB
              </span>
              <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-0.5 block">
                of {storageLimit} GB
              </span>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={storagePercentage} 
              className="h-2.5 bg-[#f5f5f5] dark:bg-[#262626] rounded-full overflow-hidden [&>div]:bg-[#0071ce]" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

