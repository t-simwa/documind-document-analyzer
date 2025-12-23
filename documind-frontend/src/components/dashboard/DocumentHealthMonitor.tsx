import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, HardDrive, RefreshCw } from "lucide-react";
import { documentsApi } from "@/services/api";

export function DocumentHealthMonitor() {
  const navigate = useNavigate();
  const [health, setHealth] = useState<{
    totalDocuments: number;
    errorCount: number;
    stuckCount: number;
    storageWarning: boolean;
    storagePercentage: number;
    errors: Array<{ id: string; name: string; status: string; uploaded_at: string }>;
    stuck: Array<{ id: string; name: string; status: string; uploaded_at: string; hours_stuck: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const healthData = await documentsApi.getHealth();
      setHealth(healthData);
    } catch (error) {
      console.error("Failed to fetch document health:", error);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (documentId: string) => {
    navigate(`/app/documents?doc=${documentId}&retry=true`);
  };

  const hasIssues = health && (health.errorCount > 0 || health.stuckCount > 0 || health.storageWarning);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Health Status
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Health Status
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHealth}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        {!hasIssues ? (
          <div className="flex items-center gap-2 py-2">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
              All systems operational
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Storage Warning */}
            {health.storageWarning && (
              <div className="p-3 rounded-md border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-start gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-1">
                      Storage at {health.storagePercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-2">
                      Consider cleaning up old documents
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/app/documents")}
                      className="h-6 px-2 text-xs"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Errors */}
            {health.errorCount > 0 && (
              <div className="p-3 rounded-md border border-red-500/20 bg-red-500/5">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                        Errors
                      </p>
                      <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                        {health.errorCount}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {health.errors.slice(0, 2).map((error) => (
                        <div
                          key={error.id}
                          className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#0a0a0a]"
                        >
                          <p className="text-xs text-[#171717] dark:text-[#fafafa] truncate flex-1">
                            {error.name}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(error.id)}
                            className="h-5 px-1.5 text-[10px] ml-1"
                          >
                            Retry
                          </Button>
                        </div>
                      ))}
                      {health.errors.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/app/documents?status=error")}
                          className="w-full h-6 text-xs"
                        >
                          View All ({health.errors.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stuck Documents */}
            {health.stuckCount > 0 && (
              <div className="p-3 rounded-md border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                        Stuck
                      </p>
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px] border-yellow-500 text-yellow-500">
                        {health.stuckCount}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {health.stuck.slice(0, 2).map((stuck) => (
                        <div
                          key={stuck.id}
                          className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#0a0a0a]"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#171717] dark:text-[#fafafa] truncate">
                              {stuck.name}
                            </p>
                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                              {stuck.hours_stuck}h
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(stuck.id)}
                            className="h-5 px-1.5 text-[10px] ml-1"
                          >
                            Retry
                          </Button>
                        </div>
                      ))}
                      {health.stuck.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/app/documents?status=processing")}
                          className="w-full h-6 text-xs"
                        >
                          View All ({health.stuck.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
