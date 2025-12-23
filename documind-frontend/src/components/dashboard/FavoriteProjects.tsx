import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, RefreshCw } from "lucide-react";
import { FolderIcon, FileTextIcon, CalendarIcon, StarIcon } from "./DashboardIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { projectsApi } from "@/services/api";
import { Project } from "@/types/api";

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

// Color palette for project cards
const projectColors = [
  "bg-[#404040]",
  "bg-[#525252]",
  "bg-[#262626]",
  "bg-[#363636]",
  "bg-[#2a2a2a]",
];

export function FavoriteProjects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
    
    // Refresh favorites when window regains focus (user switches back to tab)
    const handleFocus = () => {
      fetchFavorites();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getFavorites({ page: 1, limit: 10 });
      setProjects(response.projects);
    } catch (error) {
      console.error("Failed to fetch favorite projects:", error);
      toast({
        title: "Error",
        description: "Failed to load favorite projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/app/projects/${projectId}`);
    toast({
      title: "Opening project",
      description: "Navigating to project details...",
    });
  };

  const handleUnfavorite = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await projectsApi.toggleFavorite(projectId);
      // Remove from local state
      setProjects(projects.filter((p) => p.id !== projectId));
      toast({
        title: "Removed from favorites",
        description: "Project removed from favorites.",
      });
    } catch (error) {
      console.error("Failed to unfavorite project:", error);
      toast({
        title: "Error",
        description: "Failed to remove project from favorites",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
              Favorite Projects
            </h2>
            <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
              Your most frequently accessed projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchFavorites}
              className="text-[13px] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
              title="Refresh favorites"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/projects")}
              className="text-[13px] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
            >
              View All
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">Loading favorite projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
              <FolderIcon className="h-7 w-7 text-[#a3a3a3] dark:text-[#525252]" />
            </div>
            <p className="text-sm font-medium text-[#737373] dark:text-[#a3a3a3] mb-2">No favorite projects yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/app/projects")}
              className="mt-2"
            >
              Browse Projects
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, index) => {
              const color = projectColors[index % projectColors.length];
              const lastAccessed = project.updatedAt || project.createdAt;
              
              return (
                <div
                  key={project.id}
                  className="group relative p-5 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        <FolderIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="text-[14px] font-semibold text-[#171717] dark:text-[#fafafa] truncate">
                            {project.name}
                          </h4>
                          {project.isFavorite && (
                            <StarIcon className="h-3.5 w-3.5 text-[#171717] dark:text-[#fafafa] flex-shrink-0" filled />
                          )}
                        </div>
                        <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3] line-clamp-1">
                          {project.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleUnfavorite(project.id, e)}>
                          Remove from favorites
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                    <div className="flex items-center gap-1.5">
                      <FileTextIcon className="h-3.5 w-3.5" />
                      <span className="font-medium">{project.documentCount || 0} documents</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span className="font-medium">{formatTimeAgo(lastAccessed)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

