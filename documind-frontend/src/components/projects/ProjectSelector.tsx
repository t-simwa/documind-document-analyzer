import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Folder } from "lucide-react";
import { ProjectDialog } from "./ProjectDialog";
import { projectsApi } from "@/services/api";
import type { Project } from "@/types/api";

interface ProjectSelectorProps {
  value?: string | null;
  onChange: (projectId: string | null) => void;
  placeholder?: string;
  showCreateButton?: boolean;
}

export const ProjectSelector = ({
  value,
  onChange,
  placeholder = "Select a project",
  showCreateButton = true,
}: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.list();
      setProjects(response.projects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: { name: string; description?: string; parentId?: string | null }) => {
    await projectsApi.create(data);
    await loadProjects();
  };

  return (
    <>
      <div className="flex gap-2">
        <Select
          value={value || "none"}
          onValueChange={(val) => onChange(val === "none" ? null : val)}
          disabled={loading}
        >
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No project</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span>{project.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showCreateButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setDialogOpen(true)}
            title="Create new project"
            className="h-9 w-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleCreateProject}
        projects={projects}
      />
    </>
  );
};

