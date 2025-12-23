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
      <div className="flex gap-1.5">
        <Select
          value={value || "none"}
          onValueChange={(val) => onChange(val === "none" ? null : val)}
          disabled={loading}
        >
          <SelectTrigger className="flex-1 h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
            <SelectItem value="none" className="text-xs">No project</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id} className="text-xs">
                <div className="flex items-center gap-1.5">
                  <Folder className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
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
            className="h-8 w-8 border-[#e5e5e5] dark:border-[#262626]"
          >
            <Plus className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
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

