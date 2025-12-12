import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";
import { FolderIcon, FileTextIcon, CalendarIcon, StarIcon } from "./DashboardIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  lastAccessed: Date;
  isFavorite: boolean;
  color?: string;
}

// Mock project data - replace with actual API call
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Legal Documents",
    description: "Contracts, agreements, and legal paperwork",
    documentCount: 24,
    lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isFavorite: true,
    color: "bg-[#404040]",
  },
  {
    id: "2",
    name: "Financial Reports",
    description: "Quarterly and annual financial statements",
    documentCount: 18,
    lastAccessed: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isFavorite: true,
    color: "bg-[#525252]",
  },
  {
    id: "3",
    name: "Research Papers",
    description: "Academic research and analysis documents",
    documentCount: 42,
    lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isFavorite: true,
    color: "bg-[#262626]",
  },
];

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

export function FavoriteProjects() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // TODO: Replace with actual API call
  const projects = mockProjects;

  const handleProjectClick = (projectId: string) => {
    navigate(`/app/projects/${projectId}`);
    toast({
      title: "Opening project",
      description: "Navigating to project details...",
    });
  };

  const handleUnfavorite = (projectId: string) => {
    toast({
      title: "Removed from favorites",
      description: "Project removed from favorites.",
    });
    // TODO: Implement unfavorite API call
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
      <div className="p-6">
        {projects.length === 0 ? (
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
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative p-5 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:shadow-sm transition-all duration-200 cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl ${project.color || "bg-[#f5f5f5] dark:bg-[#262626]"} flex items-center justify-center flex-shrink-0 shadow-sm`}
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
                        {project.description}
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
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleUnfavorite(project.id);
                      }}>
                        Remove from favorites
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                  <div className="flex items-center gap-1.5">
                    <FileTextIcon className="h-3.5 w-3.5" />
                    <span className="font-medium">{project.documentCount} documents</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span className="font-medium">{formatTimeAgo(project.lastAccessed)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

