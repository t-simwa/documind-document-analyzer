import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { documentsApi, projectsApi } from "@/services/api";
import { FileText, Folder, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document, Project } from "@/types/api";

interface RecentWorkProps {
  limit?: number;
}

export function RecentWork({ limit = 10 }: RecentWorkProps) {
  const navigate = useNavigate();
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentWork();
  }, []);

  const fetchRecentWork = async () => {
    try {
      setLoading(true);
      
      // Fetch recent documents and projects in parallel
      const [documentsResponse, projectsResponse] = await Promise.all([
        documentsApi.listRecent(limit),
        projectsApi.list({ limit: 5 }), // Get recent projects (they're already sorted by creation date)
      ]);
      
      setRecentDocuments(documentsResponse.documents || []);
      setRecentProjects(projectsResponse.projects?.slice(0, 5) || []);
    } catch (error) {
      console.error("Failed to fetch recent work:", error);
      setRecentDocuments([]);
      setRecentProjects([]);
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDocumentClick = (documentId: string) => {
    navigate(`/app/documents?doc=${documentId}`);
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/app/documents?project=${projectId}`);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Recent Work
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
        </div>
      </div>
    );
  }

  const hasContent = recentDocuments.length > 0 || recentProjects.length > 0;

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Recent Work
          </h2>
          {(recentDocuments.length > 0 || recentProjects.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/documents")}
              className="h-7 px-2 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
            >
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-4">
        {!hasContent ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
              No recent work
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Recent Documents */}
            {recentDocuments.length > 0 && (
              <div>
                <h3 className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wide mb-2">
                  Documents
                </h3>
                <div className="space-y-1">
                  {recentDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleDocumentClick(doc.id)}
                      className="w-full group flex items-center gap-2.5 p-2 rounded-md hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors text-left"
                    >
                      <div className="relative flex-shrink-0">
                        <FileText className="h-4 w-4 text-[#737373] dark:text-[#a3a3a3]" />
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white dark:border-[#171717]",
                            getStatusColor(doc.status)
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#171717] dark:text-[#fafafa] truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                          {formatTimeAgo(new Date(doc.uploadedAt))}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div>
                <h3 className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wide mb-2">
                  Projects
                </h3>
                <div className="space-y-1">
                  {recentProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className="w-full group flex items-center gap-2.5 p-2 rounded-md hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors text-left"
                    >
                      <Folder className="h-4 w-4 text-[#737373] dark:text-[#a3a3a3] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-[#171717] dark:text-[#fafafa] truncate">
                            {project.name}
                          </p>
                          {project.isFavorite && (
                            <span className="text-[10px] text-yellow-500">★</span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-xs text-[#737373] dark:text-[#a3a3a3] line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

