import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { documentsApi, projectsApi } from "@/services/api";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileTextIcon, FolderIcon } from "./DashboardIcons";
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
        documentsApi.listRecent(5), // Get last 5 documents
        projectsApi.list({ limit: 3 }), // Get last 3 projects
      ]);
      
      setRecentDocuments((documentsResponse.documents || []).slice(0, 5));
      setRecentProjects((projectsResponse.projects || []).slice(0, 3));
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
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-[#525252]";
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
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/documents")}
              className="h-6 px-2 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
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
          <div className="space-y-4">
            {/* Recent Documents */}
            {recentDocuments.length > 0 && (
              <div>
                <h3 className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wide mb-2">
                  Documents
                </h3>
                <div className="space-y-2">
                  {recentDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleDocumentClick(doc.id)}
                      className="w-full group flex items-start gap-2.5 p-2 rounded-md hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors text-left"
                    >
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className={cn(
                          "w-6 h-6 rounded-md flex items-center justify-center",
                          doc.status === "ready" && "bg-green-500",
                          doc.status === "processing" && "bg-blue-500",
                          doc.status === "error" && "bg-red-500",
                          !["ready", "processing", "error"].includes(doc.status) && "bg-[#f5f5f5] dark:bg-[#262626]"
                        )}>
                          <FileTextIcon className={cn(
                            "h-4 w-4",
                            ["ready", "processing", "error"].includes(doc.status) ? "text-white" : "text-[#737373] dark:text-[#a3a3a3]"
                          )} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <h4 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] leading-snug truncate">
                            {doc.name}
                          </h4>
                          <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap flex-shrink-0">
                            {formatTimeAgo(new Date(doc.uploadedAt))}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] line-clamp-1">
                          {doc.status === "ready" ? "Ready" : doc.status === "processing" ? "Processing..." : doc.status === "error" ? "Error" : doc.status}
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
                <div className="space-y-2">
                  {recentProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className="w-full group flex items-start gap-2.5 p-2 rounded-md hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors text-left"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-md bg-[#404040] flex items-center justify-center">
                          <FolderIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] leading-snug truncate">
                              {project.name}
                            </h4>
                            {project.isFavorite && (
                              <span className="text-[10px] text-yellow-500 flex-shrink-0">★</span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap flex-shrink-0">
                            {formatTimeAgo(new Date(project.updatedAt || project.createdAt))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                          <span>{project.documentCount || 0} docs</span>
                          {project.description && (
                            <>
                              <span>•</span>
                              <span className="line-clamp-1">{project.description}</span>
                            </>
                          )}
                        </div>
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

