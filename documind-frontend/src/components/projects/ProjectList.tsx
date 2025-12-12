import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Folder, FolderOpen, MoreVertical, Edit, Trash2, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectDialog } from "./ProjectDialog";
import { projectsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/types/api";

interface ProjectListProps {
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string | null) => void;
}

export const ProjectList = ({ selectedProjectId, onSelectProject }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getHierarchy();
      setProjects(response);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: { name: string; description?: string; parentId?: string | null }) => {
    try {
      await projectsApi.create(data);
      await loadProjects();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProject = async (data: { name: string; description?: string; parentId?: string | null }) => {
    if (!editingProject) return;
    try {
      await projectsApi.update(editingProject.id, data);
      await loadProjects();
      setEditingProject(null);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? Documents will be moved to the default project.")) {
      return;
    }
    try {
      await projectsApi.delete(id);
      await loadProjects();
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const renderProject = (project: Project, level = 0): JSX.Element => {
    const isSelected = selectedProjectId === project.id;
    const hasChildren = project.children && project.children.length > 0;

    return (
      <div key={project.id} className="space-y-1">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors
            ${isSelected ? "bg-secondary" : "hover:bg-secondary/50"}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelectProject?.(project.id)}
        >
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="flex-1 text-sm truncate">{project.name}</span>
          {project.documentCount !== undefined && (
            <span className="text-xs text-muted-foreground">{project.documentCount}</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingProject(project)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteProject(project.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hasChildren && (
          <div className="space-y-1">
            {project.children!.map((child) => renderProject(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const flattenProjects = (projects: Project[]): Project[] => {
    const result: Project[] = [];
    projects.forEach((p) => {
      result.push(p);
      if (p.children) {
        result.push(...flattenProjects(p.children));
      }
    });
    return result;
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading projects...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Organize your documents</CardDescription>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div
              className={`
                flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors
                ${selectedProjectId === null ? "bg-secondary" : "hover:bg-secondary/50"}
              `}
              onClick={() => onSelectProject?.(null)}
            >
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">All Documents</span>
            </div>
            {projects.map((project) => renderProject(project))}
          </div>
        </CardContent>
      </Card>

      <ProjectDialog
        open={dialogOpen || editingProject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setEditingProject(null);
          }
        }}
        onSave={editingProject ? handleUpdateProject : handleCreateProject}
        project={editingProject}
        projects={flattenProjects(projects)}
      />
    </>
  );
};

