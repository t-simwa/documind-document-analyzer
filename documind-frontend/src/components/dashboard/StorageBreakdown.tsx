import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { documentsApi, projectsApi, metricsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface StorageBreakdown {
  totalUsed: number;
  totalLimit: number;
  byProject: Array<{
    projectId: string;
    projectName: string;
    size: number;
    percentage: number;
    documentCount: number;
  }>;
  byType: Array<{
    type: string;
    size: number;
    percentage: number;
    count: number;
  }>;
  oldestDocuments: Array<{
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
  }>;
  cleanupSuggestions: {
    unusedDocuments: number;
    duplicates: number;
    oldDocuments: number;
  };
}

export function StorageBreakdown() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"project" | "type" | "cleanup">("project");

  useEffect(() => {
    fetchBreakdown();
  }, []);

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      
      // Fetch documents, projects, and storage metrics
      const [documents, projects, storageMetrics] = await Promise.all([
        documentsApi.list({ limit: 1000 }).catch(() => ({ documents: [], total: 0 })),
        projectsApi.list().catch(() => ({ projects: [], total: 0 })),
        metricsApi.getStorageMetrics()
      ]);
      
      const totalUsed = storageMetrics.storage.usedGb;
      const totalLimit = storageMetrics.storage.limitGb;
      
      // Calculate by project
      const projectMap = new Map<string, { name: string; size: number; count: number }>();
      documents.documents.forEach(doc => {
        if (doc.project_id) {
          const project = projects.projects.find(p => p.id === doc.project_id);
          const projectName = project?.name || "Unassigned";
          const current = projectMap.get(doc.project_id) || { name: projectName, size: 0, count: 0 };
          projectMap.set(doc.project_id, {
            name: current.name,
            size: current.size + (doc.size || 0),
            count: current.count + 1
          });
        }
      });
      
      const byProject = Array.from(projectMap.entries())
        .map(([projectId, data]) => ({
          projectId,
          projectName: data.name,
          size: data.size / (1024 * 1024 * 1024), // Convert to GB
          percentage: totalUsed > 0 ? (data.size / (1024 * 1024 * 1024) / totalUsed) * 100 : 0,
          documentCount: data.count
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);
      
      // Calculate by type
      const typeMap = new Map<string, { size: number; count: number }>();
      documents.documents.forEach(doc => {
        const type = doc.file_type?.toUpperCase() || "UNKNOWN";
        const current = typeMap.get(type) || { size: 0, count: 0 };
        typeMap.set(type, {
          size: current.size + (doc.size || 0),
          count: current.count + 1
        });
      });
      
      const byType = Array.from(typeMap.entries())
        .map(([type, data]) => ({
          type,
          size: data.size / (1024 * 1024 * 1024), // Convert to GB
          percentage: totalUsed > 0 ? (data.size / (1024 * 1024 * 1024) / totalUsed) * 100 : 0,
          count: data.count
        }))
        .sort((a, b) => b.size - a.size);
      
      // Get oldest documents
      const oldestDocuments = documents.documents
        .sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime())
        .slice(0, 5)
        .map(doc => ({
          id: doc.id,
          name: doc.name,
          size: (doc.size || 0) / (1024 * 1024 * 1024), // Convert to GB
          uploadedAt: doc.uploaded_at
        }));
      
      // Calculate cleanup suggestions (mock for now)
      const cleanupSuggestions = {
        unusedDocuments: documents.documents.filter(d => {
          const daysSinceUpload = (Date.now() - new Date(d.uploaded_at).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpload > 90 && !d.last_accessed_at;
        }).length,
        duplicates: 0, // Would need duplicate detection
        oldDocuments: documents.documents.filter(d => {
          const daysSinceUpload = (Date.now() - new Date(d.uploaded_at).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpload > 180;
        }).length
      };
      
      setBreakdown({
        totalUsed,
        totalLimit,
        byProject,
        byType,
        oldestDocuments,
        cleanupSuggestions
      });
    } catch (error) {
      console.error("Failed to fetch storage breakdown:", error);
      toast({
        title: "Error",
        description: "Failed to load storage breakdown",
        variant: "destructive",
      });
      setBreakdown(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Storage Breakdown
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return null;
  }

  const storagePercentage = (breakdown.totalUsed / breakdown.totalLimit) * 100;

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
          Storage Breakdown
        </h2>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {/* Storage Overview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                Total Storage
              </span>
              <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                {breakdown.totalUsed.toFixed(2)} / {breakdown.totalLimit} GB
              </span>
            </div>
            <Progress 
              value={storagePercentage} 
              className={cn(
                "h-1.5 bg-[#e5e5e5] dark:bg-[#262626]",
                storagePercentage > 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-500"
              )} 
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[#e5e5e5] dark:border-[#262626]">
            <button
              onClick={() => setActiveTab("project")}
              className={cn(
                "px-2 py-1 text-xs font-medium transition-colors",
                activeTab === "project"
                  ? "text-[#171717] dark:text-[#fafafa] border-b-2 border-[#171717] dark:border-[#fafafa]"
                  : "text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
              )}
            >
              By Project
            </button>
            <button
              onClick={() => setActiveTab("type")}
              className={cn(
                "px-2 py-1 text-xs font-medium transition-colors",
                activeTab === "type"
                  ? "text-[#171717] dark:text-[#fafafa] border-b-2 border-[#171717] dark:border-[#fafafa]"
                  : "text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
              )}
            >
              By Type
            </button>
            <button
              onClick={() => setActiveTab("cleanup")}
              className={cn(
                "px-2 py-1 text-xs font-medium transition-colors",
                activeTab === "cleanup"
                  ? "text-[#171717] dark:text-[#fafafa] border-b-2 border-[#171717] dark:border-[#fafafa]"
                  : "text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
              )}
            >
              Cleanup
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "project" && (
            <div className="space-y-2">
              {breakdown.byProject.length > 0 ? (
                breakdown.byProject.map((project) => (
                  <div
                    key={project.projectId}
                    className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] truncate">
                          {project.projectName}
                        </p>
                        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                          {project.documentCount} documents
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#171717] dark:text-[#fafafa] ml-2">
                        {project.size.toFixed(2)} GB
                      </span>
                    </div>
                    <Progress 
                      value={project.percentage} 
                      className="h-1 bg-[#e5e5e5] dark:bg-[#262626] [&>div]:bg-blue-500" 
                    />
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3] text-center py-2">
                  No projects with documents
                </p>
              )}
            </div>
          )}

          {activeTab === "type" && (
            <div className="space-y-2">
              {breakdown.byType.length > 0 ? (
                breakdown.byType.map((type) => (
                  <div
                    key={type.type}
                    className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                          {type.type}
                        </p>
                        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                          {type.count} files
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#171717] dark:text-[#fafafa] ml-2">
                        {type.size.toFixed(2)} GB
                      </span>
                    </div>
                    <Progress 
                      value={type.percentage} 
                      className="h-1 bg-[#e5e5e5] dark:bg-[#262626] [&>div]:bg-purple-500" 
                    />
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3] text-center py-2">
                  No documents found
                </p>
              )}
            </div>
          )}

          {activeTab === "cleanup" && (
            <div className="space-y-2">
              {/* Cleanup Suggestions */}
              {breakdown.cleanupSuggestions.unusedDocuments > 0 && (
                <div className="p-2.5 rounded-md border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                        Unused Documents
                      </p>
                      <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                        {breakdown.cleanupSuggestions.unusedDocuments} documents not accessed in 90+ days
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/app/documents?filter=unused")}
                      className="h-6 px-2 text-xs"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              )}
              {breakdown.cleanupSuggestions.oldDocuments > 0 && (
                <div className="p-2.5 rounded-md border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                        Old Documents
                      </p>
                      <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                        {breakdown.cleanupSuggestions.oldDocuments} documents older than 180 days
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/app/documents?filter=old")}
                      className="h-6 px-2 text-xs"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              )}
              {breakdown.cleanupSuggestions.unusedDocuments === 0 && 
               breakdown.cleanupSuggestions.oldDocuments === 0 && (
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3] text-center py-2">
                  No cleanup suggestions
                </p>
              )}

              {/* Oldest Documents */}
              {breakdown.oldestDocuments.length > 0 && (
                <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-2">
                    Oldest Documents
                  </p>
                  <div className="space-y-1.5">
                    {breakdown.oldestDocuments.slice(0, 3).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#171717] dark:text-[#fafafa] truncate">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] ml-2">
                          {doc.size.toFixed(2)} GB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
