import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { activityApi } from "@/services/api";
import type { Activity } from "@/types/api";
import {
  ActivityUploadIcon,
  ActivityProcessIcon,
  ActivityCompleteIcon,
  ActivityErrorIcon,
  ActivityProjectIcon,
  ActivityQueryIcon,
  FileTextIcon
} from "./DashboardIcons";

interface Activity {
  id: string;
  type: "upload" | "process" | "complete" | "error" | "project" | "query";
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  status?: "success" | "error" | "processing";
}

// Mock activity data - replace with actual API call
const mockActivities: Activity[] = [
  {
    id: "1",
    type: "complete",
    title: "Document processed successfully",
    description: "Annual Report 2024.pdf has been processed and is ready for analysis",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    user: "John Doe",
    status: "success",
  },
  {
    id: "2",
    type: "upload",
    title: "New document uploaded",
    description: "Q4 Financial Statement.pdf was uploaded",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    user: "Jane Smith",
    status: "success",
  },
  {
    id: "3",
    type: "process",
    title: "Document processing",
    description: "Contract Agreement.docx is being processed",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    user: "John Doe",
    status: "processing",
  },
  {
    id: "4",
    type: "project",
    title: "Project created",
    description: "New project 'Legal Documents' was created",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    user: "Jane Smith",
    status: "success",
  },
  {
    id: "5",
    type: "query",
    title: "AI query executed",
    description: "Query executed on 'Annual Report 2024.pdf'",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    user: "John Doe",
    status: "success",
  },
  {
    id: "6",
    type: "error",
    title: "Processing failed",
    description: "Failed to process 'Corrupted File.pdf' - Invalid format",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    user: "Jane Smith",
    status: "error",
  },
];

const getActivityIcon = (type: Activity["type"], status?: Activity["status"]) => {
  switch (type) {
    case "upload":
      return <ActivityUploadIcon className="h-4 w-4" />;
    case "process":
      return <ActivityProcessIcon className="h-4 w-4" />;
    case "complete":
      return <ActivityCompleteIcon className="h-4 w-4" />;
    case "error":
      return <ActivityErrorIcon className="h-4 w-4" />;
    case "project":
      return <ActivityProjectIcon className="h-4 w-4" />;
    case "query":
      return <ActivityQueryIcon className="h-4 w-4" />;
    default:
      return <FileTextIcon className="h-4 w-4" />;
  }
};

const getActivityColor = (type: Activity["type"], status?: Activity["status"]) => {
  if (status === "error") return "text-[#525252] dark:text-[#737373]";
  if (status === "processing") return "text-[#404040] dark:text-[#a3a3a3]";
  if (status === "success") return "text-[#171717] dark:text-[#fafafa]";
  return "text-muted-foreground";
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);
        const response = await activityApi.list({
          page: 1,
          limit: 20,
        });
        setActivities(response.activities);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setError(err instanceof Error ? err.message : "Failed to load activities");
        // Fallback to empty array on error
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
    
    // Refresh activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
          Recent Activity
        </h2>
      </div>
      <div className="p-4">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-xs text-red-500 mb-1">Failed to load</p>
                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">{error}</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2.5 p-2 rounded-md hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors"
                  >
                    <div className={cn(
                      "mt-0.5 flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center",
                      activity.status === "error" && "bg-red-500 text-white",
                      activity.status === "processing" && "bg-blue-500 text-white",
                      activity.status === "success" && "bg-green-500 text-white",
                      !activity.status && "bg-[#f5f5f5] dark:bg-[#262626] text-[#737373] dark:text-[#a3a3a3]"
                    )}>
                      {getActivityIcon(activity.type, activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h4 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] leading-snug">
                          {activity.title}
                        </h4>
                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap flex-shrink-0">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] line-clamp-1">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

