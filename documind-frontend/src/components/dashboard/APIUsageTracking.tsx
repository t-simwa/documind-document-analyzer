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
        <Badge variant="outline" className="bg-green-500 text-white border-0 h-4 px-1.5 text-[10px]">
          <StatusActiveIcon className="h-2.5 w-2.5 mr-0.5" />
          Active
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="bg-yellow-500 text-white border-0 h-4 px-1.5 text-[10px]">
          <StatusWarningIcon className="h-2.5 w-2.5 mr-0.5" />
          Warning
        </Badge>
      );
    case "limit_reached":
      return (
        <Badge variant="outline" className="bg-red-500 text-white border-0 h-4 px-1.5 text-[10px]">
          <StatusErrorIcon className="h-2.5 w-2.5 mr-0.5" />
          Limit
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
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            API Usage
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#a3a3a3]">
            <KeyIcon className="h-3.5 w-3.5" />
            <span>{apiKeys.length} keys</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Overall Usage Summary */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-[#fafafa] dark:bg-[#0a0a0a]">
              <div className="text-[10px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-medium mb-1.5">
                Total Requests
              </div>
              <div className="text-base font-semibold text-[#171717] dark:text-[#fafafa] mb-0.5 leading-none">
                {totalRequests.toLocaleString()}
              </div>
              <div className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                of {totalLimit.toLocaleString()} limit
              </div>
            </div>
            <div className="p-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-[#fafafa] dark:bg-[#0a0a0a]">
              <div className="text-[10px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-medium mb-1.5">
                Usage Rate
              </div>
              <div className="text-base font-semibold text-[#171717] dark:text-[#fafafa] mb-0.5 leading-none">
                {usagePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                {remainingRequests.toLocaleString()} remaining
              </div>
            </div>
            <div className="p-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-[#fafafa] dark:bg-[#0a0a0a]">
              <div className="text-[10px] uppercase tracking-wide text-[#737373] dark:text-[#a3a3a3] font-medium mb-1.5">
                Active Keys
              </div>
              <div className="text-base font-semibold text-[#171717] dark:text-[#fafafa] mb-0.5 leading-none">
                {apiKeys.filter(k => k.status === "active").length}
              </div>
              <div className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                {apiKeys.filter(k => k.status === "warning" || k.status === "limit_reached").length} with issues
              </div>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Overall Usage</span>
              <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                {totalRequests.toLocaleString()} / {totalLimit.toLocaleString()}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-1.5 bg-[#e5e5e5] dark:bg-[#262626] [&>div]:bg-[#0071ce]" />
          </div>
        </div>

        {/* API Keys List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wide">
              API Keys
            </h3>
            <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
              {apiKeys.length} total
            </span>
          </div>
          <div className="space-y-2">
              {apiKeys.map((apiKey) => {
                const keyUsagePercentage = (apiKey.requests / apiKey.limit) * 100;
                const remaining = apiKey.limit - apiKey.requests;
                return (
                  <div
                    key={apiKey.id}
                    className="p-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-[#fafafa] dark:bg-[#0a0a0a]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#e5e5e5] dark:border-[#262626]">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                          {apiKey.name}
                        </h4>
                        {getStatusBadge(apiKey.status)}
                      </div>
                      <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                        {formatTimeAgo(apiKey.lastUsed)}
                      </span>
                    </div>

                    {/* Usage Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <div className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mb-0.5">Used</div>
                        <div className="text-sm font-semibold text-[#171717] dark:text-[#fafafa] leading-none">
                          {apiKey.requests.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mb-0.5">Remaining</div>
                        <div className="text-sm font-semibold text-[#171717] dark:text-[#fafafa] leading-none">
                          {remaining.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mb-0.5">Usage</div>
                        <div className="text-sm font-semibold text-[#171717] dark:text-[#fafafa] leading-none">
                          {keyUsagePercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <Progress
                      value={keyUsagePercentage}
                      className="h-1.5 bg-[#e5e5e5] dark:bg-[#262626] [&>div]:bg-[#0071ce]"
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

