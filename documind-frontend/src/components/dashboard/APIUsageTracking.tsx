import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { KeyIcon, TrendingUpIcon, StatusActiveIcon, StatusWarningIcon, StatusErrorIcon } from "./DashboardIcons";

interface APIKey {
  id: string;
  name: string;
  key: string;
  requests: number;
  limit: number;
  status: "active" | "warning" | "limit_reached";
  lastUsed: Date;
}

// Mock API keys data - replace with actual API call
const mockAPIKeys: APIKey[] = [
  {
    id: "1",
    name: "Production API Key",
    key: "dm_live_*****abc123",
    requests: 45230,
    limit: 100000,
    status: "active",
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    name: "Development Key",
    key: "dm_dev_*****xyz789",
    requests: 8920,
    limit: 10000,
    status: "warning",
    lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "3",
    name: "Testing Key",
    key: "dm_test_*****def456",
    requests: 10000,
    limit: 10000,
    status: "limit_reached",
    lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const getStatusBadge = (status: APIKey["status"]) => {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="bg-green-500 text-white border-0">
          <StatusActiveIcon className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="bg-yellow-500 text-white border-0">
          <StatusWarningIcon className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    case "limit_reached":
      return (
        <Badge variant="outline" className="bg-red-500 text-white border-0">
          <StatusErrorIcon className="h-3 w-3 mr-1" />
          Limit Reached
        </Badge>
      );
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function APIUsageTracking() {
  // TODO: Replace with actual API call
  const apiKeys = mockAPIKeys;

  const totalRequests = apiKeys.reduce((sum, key) => sum + key.requests, 0);
  const totalLimit = apiKeys.reduce((sum, key) => sum + key.limit, 0);
  const usagePercentage = (totalRequests / totalLimit) * 100;
  const remainingRequests = totalLimit - totalRequests;

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
              API Usage Tracking
            </h2>
            <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
              Monitor API key usage and limits
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mb-0.5">Total Keys</div>
              <div className="text-[16px] font-semibold text-[#171717] dark:text-[#fafafa]">{apiKeys.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
              <KeyIcon className="h-5 w-5 text-[#737373] dark:text-[#a3a3a3]" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overall Usage Summary */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50">
              <div className="text-[11px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-semibold mb-2">
                Total Requests
              </div>
              <div className="text-2xl font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                {totalRequests.toLocaleString()}
              </div>
              <div className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                of {totalLimit.toLocaleString()} limit
              </div>
            </div>
            <div className="p-4 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50">
              <div className="text-[11px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-semibold mb-2">
                Usage Rate
              </div>
              <div className="text-2xl font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                {usagePercentage.toFixed(1)}%
              </div>
              <div className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                {remainingRequests.toLocaleString()} remaining
              </div>
            </div>
            <div className="p-4 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50">
              <div className="text-[11px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-semibold mb-2">
                Active Keys
              </div>
              <div className="text-2xl font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                {apiKeys.filter(k => k.status === "active").length}
              </div>
              <div className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                {apiKeys.filter(k => k.status === "warning" || k.status === "limit_reached").length} with issues
              </div>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#171717] dark:text-[#fafafa]">Overall Usage</span>
              <span className="text-[13px] text-[#737373] dark:text-[#a3a3a3] font-medium">
                {totalRequests.toLocaleString()} / {totalLimit.toLocaleString()}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-3 bg-[#e5e5e5] dark:bg-[#262626] [&>div]:bg-[#0071ce]" />
          </div>
        </div>

        {/* API Keys List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[#171717] dark:text-[#fafafa] uppercase tracking-wide">
              API Keys
            </h3>
            <span className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">
              {apiKeys.length} total
            </span>
          </div>
          <div className="space-y-3">
              {apiKeys.map((apiKey) => {
                const keyUsagePercentage = (apiKey.requests / apiKey.limit) * 100;
                const remaining = apiKey.limit - apiKey.requests;
                return (
                  <div
                    key={apiKey.id}
                    className="group border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] hover:border-[#d4d4d4] dark:hover:border-[#404040] transition-all duration-200"
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#e5e5e5] dark:border-[#262626]">
                        <div className="flex items-center gap-3">
                          <h4 className="text-[15px] font-semibold text-[#171717] dark:text-[#fafafa]">
                            {apiKey.name}
                          </h4>
                          {getStatusBadge(apiKey.status)}
                        </div>
                        <span className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                          Last used {formatTimeAgo(apiKey.lastUsed)}
                        </span>
                      </div>

                      {/* API Key */}
                      <div className="mb-5">
                        <div className="text-[11px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-semibold mb-2">
                          API Key
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center flex-shrink-0">
                            <KeyIcon className="h-4 w-4 text-[#737373] dark:text-[#a3a3a3]" />
                          </div>
                          <code className="flex-1 text-[13px] font-mono bg-[#fafafa] dark:bg-[#0a0a0a] px-3 py-2 rounded border border-[#e5e5e5] dark:border-[#262626] text-[#171717] dark:text-[#fafafa]">
                            {apiKey.key}
                          </code>
                        </div>
                      </div>

                      {/* Usage Metrics */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-center">
                            <div className="text-[11px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-semibold mb-2">
                              Used
                            </div>
                            <div className="text-[20px] font-semibold text-[#171717] dark:text-[#fafafa] leading-tight">
                              {apiKey.requests.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[11px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-semibold mb-2">
                              Remaining
                            </div>
                            <div className="text-[20px] font-semibold text-[#171717] dark:text-[#fafafa] leading-tight">
                              {remaining.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[11px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-semibold mb-2">
                              Usage
                            </div>
                            <div className="text-[20px] font-semibold text-[#171717] dark:text-[#fafafa] leading-tight">
                              {keyUsagePercentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-[#737373] dark:text-[#a3a3a3] font-medium">
                              {apiKey.requests.toLocaleString()} of {apiKey.limit.toLocaleString()} requests
                            </span>
                            <span className="text-[#737373] dark:text-[#a3a3a3] font-medium">
                              {keyUsagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={keyUsagePercentage}
                            className="h-3 bg-[#e5e5e5] dark:bg-[#262626] [&>div]:bg-[#0071ce]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

