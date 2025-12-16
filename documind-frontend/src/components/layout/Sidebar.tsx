import { useState, useEffect, useCallback, useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  openProjectDialog?: boolean;
  onProjectDialogChange?: (open: boolean) => void;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-[15px] w-[15px] text-red-400" />;
    case 'docx':
      return <FileText className="h-[15px] w-[15px] text-blue-400" />;
    default:
      return <File className="h-[15px] w-[15px] text-muted-foreground" />;
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
  openProjectDialog,
  onProjectDialogChange,
}: SidebarProps) => {
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Handle external trigger to open project dialog
  useEffect(() => {
    if (openProjectDialog) {
      setProjectDialogOpen(true);
      onProjectDialogChange?.(false);
    }
  }, [openProjectDialog, onProjectDialogChange]);

  // Load projects only once when component mounts (if onSelectProject is available)
  useEffect(() => {
    if (onSelectProject) {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const response = await projectsApi.getHierarchy();
      setProjects(response);
      
      // Debug: Log the hierarchy to help diagnose issues
      console.log("Loaded projects hierarchy:", response);
      console.log("Projects count:", response.length);
      response.forEach((p) => {
        console.log(`  - ${p.name} (ID: ${p.id}, Parent: ${p.parentId}, Children: ${p.children?.length || 0})`);
        if (p.children && p.children.length > 0) {
          p.children.forEach((c) => {
            console.log(`    └─ ${c.name} (ID: ${c.id}, Parent: ${c.parentId})`);
          });
        }
      });
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load projects. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoadingProjects(false);
    }
  }, [toast]);

  const handleCreateProject = async (data: { name: string; description?: string; parentId?: string | null }) => {
    try {
      // Preserve current expanded state
      const currentExpanded = new Set(expandedProjects);
      
      // Auto-expand parent project if child was created
      if (data.parentId) {
        currentExpanded.add(data.parentId);
      }
      
      await projectsApi.create(data);
      await loadProjects();
      
      // Restore expanded state after reload (including parent if child was created)
      setExpandedProjects(currentExpanded);
      
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
      // Preserve current expanded state
      const currentExpanded = new Set(expandedProjects);
      const oldParentId = editingProject.parentId;
      const newParentId = data.parentId;
      
      // If parent changed, expand the new parent (if any)
      if (oldParentId !== newParentId) {
        // Remove from old parent's expanded state if it was expanded
        if (oldParentId) {
          currentExpanded.delete(oldParentId);
        }
        // Add new parent to expanded state
        if (newParentId) {
          currentExpanded.add(newParentId);
        }
      }
      
      await projectsApi.update(editingProject.id, data);
      
      // Clear expanded state to ensure proper hierarchy refresh
      setExpandedProjects(new Set());
      await loadProjects();
      
      // Restore expanded state after reload (including new parent if changed)
      setExpandedProjects(currentExpanded);
      
      setEditingProject(null);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error) {
      console.error("Failed to update project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? Documents will be reassigned to another project if available.")) {
      return;
    }
    try {
      // Remove from expanded state if it was expanded
      setExpandedProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // If this project was selected, clear selection
      if (selectedProjectId === id) {
        onSelectProject?.(null);
      }
      
      await projectsApi.delete(id);
      
      // Clear expanded state to ensure clean refresh
      setExpandedProjects(new Set());
      
      // Reload projects after deletion
      await loadProjects();
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const toggleProjectExpanded = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const renderProject = (project: Project, level = 0): JSX.Element => {
    const isSelected = selectedProjectId === project.id;
    const hasChildren = project.children && project.children.length > 0;
    const isExpanded = expandedProjects.has(project.id);

    return (
      <div key={project.id} className="space-y-0.5">
        <div
          className={cn(
            "group flex items-center gap-2.5 w-full px-2.5 rounded-md text-[13px] transition-colors text-left relative",
            isSelected 
              ? "bg-accent text-accent-foreground font-medium py-1.5" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50 py-1.5"
          )}
          style={{ paddingLeft: `${level * 12 + 10}px` }}
          onClick={() => onSelectProject?.(project.id)}
        >
          {hasChildren ? (
            isExpanded ? (
            <FolderOpen className="h-[15px] w-[15px] flex-shrink-0 text-foreground/70" />
            ) : (
              <Folder className="h-[15px] w-[15px] flex-shrink-0 text-foreground/70" />
            )
          ) : (
            <Folder className="h-[15px] w-[15px] flex-shrink-0 text-muted-foreground" />
          )}
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{project.name}</span>
              {project.documentCount !== undefined && project.documentCount > 0 && (
                <span className="text-xs text-muted-foreground/70 font-medium tabular-nums">
                  {project.documentCount}
                </span>
              )}
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => toggleProjectExpanded(project.id, e)}
                  className="h-[22px] w-[22px] opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-[13px] w-[13px]" />
                  ) : (
                    <ChevronRight className="h-[13px] w-[13px]" />
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-[22px] w-[22px] opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-[13px] w-[13px]" />
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
        {hasChildren && !collapsed && isExpanded && (
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
                "group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors text-left cursor-pointer",
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
                    <p className="text-[13px] truncate">{doc.name}</p>
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
                    className="h-[22px] w-[22px] opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0 flex items-center justify-center rounded hover:bg-destructive/10"
                    >
                    <Trash2 className="h-[13px] w-[13px]" />
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

      {/* Projects Section */}
      {onSelectProject && (
        <div className={cn("flex-1 overflow-y-auto", !collapsed && "border-t border-border")}>
          {!collapsed && (
            <>
              <div className="px-1.5 pt-2 pb-1">
                <button
                  className={cn(
                    "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-[13px] transition-colors text-left",
                    selectedProjectId === null 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => onSelectProject(null)}
                >
                  <Folder className="h-[15px] w-[15px] flex-shrink-0" />
                  <span className="truncate">All Documents</span>
                </button>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Projects
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setProjectDialogOpen(true)}
                  className="h-[22px] w-[22px] text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-[13px] w-[13px]" />
                </Button>
              </div>
            </>
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
              onProjectDialogChange?.(false);
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
