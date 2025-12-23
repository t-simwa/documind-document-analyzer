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
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Favorite Projects
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchFavorites}
              className="h-6 w-6 p-0"
              title="Refresh favorites"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/projects")}
              className="h-6 px-2 text-xs"
            >
              View All
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-2">No favorite projects</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/projects")}
              className="h-7 px-2 text-xs"
            >
              Browse Projects
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project, index) => {
              const color = projectColors[index % projectColors.length];
              const lastAccessed = project.updatedAt || project.createdAt;
              
              return (
              <div
                key={project.id}
                className="group relative p-2.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="flex items-center gap-2.5">
                  <div
                      className={`w-8 h-8 rounded-md ${color} flex items-center justify-center flex-shrink-0`}
                  >
                    <FolderIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] truncate">
                        {project.name}
                      </h4>
                      {project.isFavorite && (
                        <StarIcon className="h-3 w-3 text-yellow-500 flex-shrink-0" filled />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                      <span>{project.documentCount || 0} docs</span>
                      <span>•</span>
                      <span>{formatTimeAgo(lastAccessed)}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleUnfavorite(project.id, e)}>
                        Remove from favorites
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

