import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileTextIcon } from "./DashboardIcons";
import { projectsApi, documentsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProjectHealthData {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  documentsPerProject: number;
  mostActiveProject?: {
    id: string;
    name: string;
    documentCount: number;
  };
}

export function ProjectHealth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState<ProjectHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectHealth();
  }, []);

  const fetchProjectHealth = async () => {
    try {
      setLoading(true);
      
      // Fetch projects and documents
      const [projects, documents] = await Promise.all([
        projectsApi.list().catch(() => ({ projects: [], total: 0 })),
        documentsApi.list({ limit: 1000 }).catch(() => ({ documents: [], total: 0 }))
      ]);
      
      // Calculate health metrics
      const totalProjects = projects.projects.length;
      const activeProjects = projects.projects.filter(p => !p.archived).length;
      const archivedProjects = totalProjects - activeProjects;
      
      // Calculate documents per project
      const projectDocCounts = new Map<string, number>();
      documents.documents.forEach(doc => {
        if (doc.project_id) {
          projectDocCounts.set(doc.project_id, (projectDocCounts.get(doc.project_id) || 0) + 1);
        }
      });
      
      const avgDocsPerProject = totalProjects > 0 
        ? Array.from(projectDocCounts.values()).reduce((a, b) => a + b, 0) / totalProjects 
        : 0;
      
      // Find most active project
      let mostActiveProject: { id: string; name: string; documentCount: number } | undefined;
      if (projectDocCounts.size > 0) {
        const sortedProjects = Array.from(projectDocCounts.entries()).sort((a, b) => b[1] - a[1]);
        const [projectId, docCount] = sortedProjects[0];
        const project = projects.projects.find(p => p.id === projectId);
        if (project) {
          mostActiveProject = {
            id: project.id,
            name: project.name,
            documentCount: docCount
          };
        }
      }
      
      setHealthData({
        totalProjects,
        activeProjects,
        archivedProjects,
        documentsPerProject: Math.round(avgDocsPerProject * 10) / 10,
        mostActiveProject
      });
    } catch (error) {
      console.error("Failed to fetch project health:", error);
      toast({
        title: "Error",
        description: "Failed to load project health",
        variant: "destructive",
      });
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Project Health
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  const activePercentage = healthData.totalProjects > 0 
    ? (healthData.activeProjects / healthData.totalProjects) * 100 
    : 0;

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
          Project Health
        </h2>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {/* Project Counts */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-center">
              <p className="text-sm font-semibold text-[#171717] dark:text-[#fafafa] leading-none">
                {healthData.totalProjects}
              </p>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                Total
              </p>
            </div>
            <div className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-center">
              <p className="text-sm font-semibold text-green-500 leading-none">
                {healthData.activeProjects}
              </p>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                Active
              </p>
            </div>
            <div className="p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-center">
              <p className="text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] leading-none">
                {healthData.archivedProjects}
              </p>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                Archived
              </p>
            </div>
          </div>

          {/* Active Projects Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                Active Projects
              </span>
              <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                {activePercentage.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={activePercentage} 
              className="h-1.5 bg-[#e5e5e5] dark:bg-[#262626] [&>div]:bg-green-500" 
            />
          </div>

          {/* Average Documents per Project */}
          <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
                <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                  Avg. docs/project
                </span>
              </div>
              <span className="text-xs font-semibold text-[#171717] dark:text-[#fafafa]">
                {healthData.documentsPerProject}
              </span>
            </div>
          </div>

          {/* Most Active Project */}
          {healthData.mostActiveProject && (
            <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                  Most Active
                </span>
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 h-4 border-blue-500/20 text-blue-500 bg-blue-500/10"
                >
                  {healthData.mostActiveProject.documentCount} docs
                </Badge>
              </div>
              <button
                onClick={() => navigate(`/app/documents?project=${healthData.mostActiveProject!.id}`)}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium truncate w-full text-left"
              >
                {healthData.mostActiveProject.name} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
