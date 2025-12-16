import { ChevronRight, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/api";

interface ProjectBreadcrumbProps {
  projects: Project[];
  onProjectClick?: (projectId: string | null) => void;
}

export const ProjectBreadcrumb = ({ projects, onProjectClick }: ProjectBreadcrumbProps) => {
  if (projects.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground px-6 py-2 border-b bg-background/50">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
        onClick={() => onProjectClick?.(null)}
      >
        Projects
      </Button>
      {projects.map((project, index) => (
        <div key={project.id} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs font-normal",
              index === projects.length - 1
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onProjectClick?.(project.id)}
          >
            <Folder className="h-3 w-3 mr-1.5" />
            {project.name}
          </Button>
        </div>
      ))}
    </div>
  );
};

