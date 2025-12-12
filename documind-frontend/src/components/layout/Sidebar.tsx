import { useState, useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  File,
  Folder,
  FolderOpen,
  MoreVertical,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { projectsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/types/api";

interface Document {
  id: string;
  name: string;
  status: "processing" | "ready" | "error";
  uploadedAt: Date;
  size: string;
  type: string;
}

interface SidebarProps {
  documents: Document[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
  onNewUpload: () => void;
  onDeleteDocument: (id: string) => void;
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-400" />;
    case 'docx':
      return <FileText className="h-4 w-4 text-blue-400" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return <Check className="h-3 w-3 text-success" />;
    case 'processing':
      return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    default:
      return null;
  }
};

export const Sidebar = ({
  documents,
  selectedDocId,
  onSelectDocument,
  onNewUpload,
  onDeleteDocument,
  selectedProjectId,
  onSelectProject,
  collapsed,
  onToggleCollapse,
}: SidebarProps) => {
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (onSelectProject) {
      loadProjects();
    }
  }, [onSelectProject]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await projectsApi.getHierarchy();
      setProjects(response);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoadingProjects(false);
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
      <div key={project.id} className="space-y-0.5">
        <div
          className={cn(
            "group flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors text-left relative",
            isSelected 
              ? "bg-accent text-accent-foreground font-medium" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          style={{ paddingLeft: `${level * 12 + 10}px` }}
          onClick={() => onSelectProject?.(project.id)}
        >
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0 text-foreground/70" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{project.name}</span>
              {project.documentCount !== undefined && project.documentCount > 0 && (
                <span className="text-xs text-muted-foreground/70 font-medium tabular-nums">
                  {project.documentCount}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setEditingProject(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
        {hasChildren && !collapsed && (
          <div className="space-y-0.5">
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

  return (
    <aside
      className={cn(
        "h-screen bg-background border-r border-border flex flex-col transition-all duration-150 ease-out",
        collapsed ? "w-[56px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-12 border-b border-border flex items-center",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        <Logo showText={!collapsed} />
        
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            className="w-full text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* New Document Button */}
      <div className="p-2">
        <Button
          onClick={onNewUpload}
          variant="outline"
          size={collapsed ? "icon-sm" : "sm"}
          className="w-full"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New</span>}
        </Button>
      </div>

      {/* Projects Section */}
      {onSelectProject && (
        <div className={cn("flex-1 overflow-y-auto", !collapsed && "border-b border-border")}>
          {!collapsed && (
            <div className="flex items-center justify-between px-3 py-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Projects
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setProjectDialogOpen(true)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          
          {collapsed && (
            <div className="p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setProjectDialogOpen(true)}
                className="w-full h-8"
                title="New Project"
              >
                <Folder className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!collapsed && (
            <div className="px-1.5 pb-2 space-y-0.5">
              <button
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors text-left",
                  selectedProjectId === null 
                    ? "bg-accent text-accent-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                onClick={() => onSelectProject(null)}
              >
                <Folder className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">All Documents</span>
              </button>
              {loadingProjects ? (
                <div className="px-2.5 py-3 text-center">
                  <div className="h-4 w-4 border-2 border-muted border-t-foreground rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                projects.map((project) => renderProject(project))
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto">
        {!collapsed && documents.length > 0 && (
          <div className="px-3 py-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Documents
          </p>
          </div>
        )}
        
        <div className="px-1.5 pb-2 space-y-0.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              onMouseEnter={() => setHoveredDoc(doc.id)}
              onMouseLeave={() => setHoveredDoc(null)}
              className={cn(
                "group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors text-left cursor-pointer",
                selectedDocId === doc.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(doc.type)}
              </div>

              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{doc.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getStatusIcon(doc.status)}
                      <span className="text-xs text-muted-foreground/70">{doc.size}</span>
                    </div>
                  </div>

                  {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0 flex items-center justify-center rounded hover:bg-destructive/10"
                    >
                    <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </>
              )}
            </div>
          ))}
        </div>

        {documents.length === 0 && !collapsed && (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-muted-foreground/70">No documents</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border">
          <div className="px-3 py-3">
            <div className="relative pl-3.5">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-foreground/20 rounded-full" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground tracking-tight">Secure</p>
                  <div className="relative">
                    <div className="w-1 h-1 rounded-full bg-success" />
                    <div className="absolute inset-0 w-1 h-1 rounded-full bg-success animate-ping opacity-75" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-normal leading-tight tracking-wide uppercase">Encrypted</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {collapsed && (
        <div className="border-t border-border p-2">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-success animate-ping opacity-60" />
            </div>
          </div>
        </div>
      )}

      {/* Project Dialog */}
      {onSelectProject && (
        <ProjectDialog
          open={projectDialogOpen || editingProject !== null}
          onOpenChange={(open) => {
            if (!open) {
              setProjectDialogOpen(false);
              setEditingProject(null);
            }
          }}
          onSave={editingProject ? handleUpdateProject : handleCreateProject}
          project={editingProject}
          projects={flattenProjects(projects)}
        />
      )}
    </aside>
  );
};
