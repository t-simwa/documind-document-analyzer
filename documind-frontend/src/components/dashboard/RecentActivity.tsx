import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
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
  // TODO: Replace with actual API call
  const activities = mockActivities;

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
          Recent Activity
        </h2>
        <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
          Latest updates across your workspace
        </p>
      </div>
      <div className="p-6">
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                  <FileTextIcon className="h-7 w-7 text-[#a3a3a3] dark:text-[#525252]" />
                </div>
                <p className="text-sm font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">No recent activity</p>
                <p className="text-xs text-[#a3a3a3] dark:text-[#737373]">Activity will appear here as you work</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
                    "hover:shadow-sm hover:border-[#d4d4d4] dark:hover:border-[#404040]",
                    index === 0 && "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]",
                    index !== 0 && "bg-white dark:bg-[#171717] border-[#f5f5f5] dark:border-[#262626]"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                    activity.status === "error" && "bg-red-500 text-white",
                    activity.status === "processing" && "bg-blue-500 text-white",
                    activity.status === "success" && "bg-green-500 text-white",
                    !activity.status && "bg-[#f5f5f5] dark:bg-[#262626] text-[#737373] dark:text-[#a3a3a3]"
                  )}>
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h4 className="text-[14px] font-semibold text-[#171717] dark:text-[#fafafa] leading-snug">
                        {activity.title}
                      </h4>
                      <span className="text-[12px] text-[#a3a3a3] dark:text-[#525252] whitespace-nowrap flex-shrink-0 font-medium">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3] mb-3 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-3">
                      {activity.user && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-[#a3a3a3] dark:text-[#525252]" />
                          <span className="text-[12px] text-[#737373] dark:text-[#a3a3a3] font-medium">
                            {activity.user}
                          </span>
                        </div>
                      )}
                      {activity.status && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] font-semibold px-2.5 py-0.5 h-5 border-0 uppercase tracking-wide text-white",
                            activity.status === "error" && "bg-red-500",
                            activity.status === "processing" && "bg-blue-500",
                            activity.status === "success" && "bg-green-500"
                          )}
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

