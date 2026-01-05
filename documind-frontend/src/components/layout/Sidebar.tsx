import { useState, useEffect, useCallback } from "react";
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
  Edit,
  Star,
  Files,
  FolderTree,
  Clock,
  Tag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { projectsApi, documentsApi, tagsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Project, DocumentTag } from "@/types/api";

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
  onTagFilter?: (tagId: string) => void;
  refreshTrigger?: number;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-3.5 w-3.5 text-red-500" />;
    case 'docx':
      return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    default:
      return <File className="h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4]" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return <Check className="h-2.5 w-2.5 text-green-500" />;
    case 'processing':
      return <Loader2 className="h-2.5 w-2.5 text-blue-500 animate-spin" />;
    case 'error':
      return <AlertCircle className="h-2.5 w-2.5 text-red-500" />;
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
  onTagFilter,
  refreshTrigger,
}: SidebarProps) => {
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["explorer", "projects"]));
  
  // New sections state
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [favoriteProjects, setFavoriteProjects] = useState<Project[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [tags, setTags] = useState<DocumentTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  
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
      loadFavoriteProjects();
    }
    loadRecentDocuments();
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Refresh projects when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0 && onSelectProject) {
      // Add a small delay to ensure backend has updated
      const timer = setTimeout(() => {
        loadProjects();
        loadFavoriteProjects();
      }, 150);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Load data when sections are expanded
  useEffect(() => {
    if (expandedSections.has("recent") && recentDocuments.length === 0 && !loadingRecent) {
      loadRecentDocuments();
    }
    if (expandedSections.has("favorites") && favoriteProjects.length === 0 && !loadingFavorites && onSelectProject) {
      loadFavoriteProjects();
    }
    if (expandedSections.has("tags") && tags.length === 0 && !loadingTags) {
      loadTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedSections]);

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const loadRecentDocuments = useCallback(async () => {
    try {
      setLoadingRecent(true);
      const response = await documentsApi.listRecent(10);
      setRecentDocuments(response.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        size: doc.size || "0 KB",
        type: doc.type || "file"
      })));
    } catch (error) {
      console.error("Failed to load recent documents:", error);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  const loadFavoriteProjects = useCallback(async () => {
    if (!onSelectProject) return;
    try {
      setLoadingFavorites(true);
      const response = await projectsApi.getFavorites({ page: 1, limit: 20 });
      setFavoriteProjects(response.projects);
    } catch (error) {
      console.error("Failed to load favorite projects:", error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [onSelectProject]);

  const loadTags = useCallback(async () => {
    try {
      setLoadingTags(true);
      const response = await tagsApi.list();
      setTags(response);
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setLoadingTags(false);
    }
  }, []);

  const handleTagClick = (tagId: string) => {
    if (onTagFilter) {
      onTagFilter(tagId);
    } else {
      // Fallback: navigate to documents with tag filter
      const url = new URL(window.location.href);
      url.searchParams.set('tag', tagId);
      window.location.href = url.toString();
    }
  };


  const handleToggleFavorite = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await projectsApi.toggleFavorite(projectId);
      // Reload projects to get updated favorite status
      await loadProjects();
      toast({
        title: "Success",
        description: "Project favorite status updated",
      });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const renderProject = (project: Project, level = 0): JSX.Element => {
    const isSelected = selectedProjectId === project.id;
    const hasChildren = project.children && project.children.length > 0;
    const isExpanded = expandedProjects.has(project.id);
    const isFavorite = project.isFavorite || false;

    return (
      <div key={project.id} className="space-y-0.5">
        <div
          className={cn(
            "group flex items-center gap-1.5 w-full px-1.5 py-0.5 text-xs transition-colors cursor-pointer",
            isSelected 
              ? "bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] font-medium" 
              : "text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          )}
          style={{ paddingLeft: `${level * 12 + 4}px` }}
          onClick={() => onSelectProject?.(project.id)}
        >
          {!collapsed && (
            <>
              {hasChildren && (
                <button
                  onClick={(e) => toggleProjectExpanded(project.id, e)}
                  className="h-4 w-4 flex items-center justify-center flex-shrink-0 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-[#525252] dark:text-[#d4d4d4]" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-[#525252] dark:text-[#d4d4d4]" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-4" />}
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-[#525252] dark:text-[#d4d4d4]" />
                ) : (
                  <Folder className="h-3.5 w-3.5 flex-shrink-0 text-[#525252] dark:text-[#d4d4d4]" />
                )
              ) : (
                <Folder className="h-3.5 w-3.5 flex-shrink-0 text-[#525252] dark:text-[#d4d4d4]" />
              )}
              <span className="flex-1 truncate">{project.name}</span>
              {isFavorite && (
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
                {project.documentCount !== undefined && project.documentCount > 0 && (
                  <span className="text-[10px] text-[#525252] dark:text-[#a3a3a3] font-medium tabular-nums mr-1">
                    {project.documentCount}
                  </span>
                )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] shadow-lg p-1">
                  <DropdownMenuItem onClick={(e) => handleToggleFavorite(project.id, e)} className="px-2.5 py-2 text-xs hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                    <Star className={cn("h-3.5 w-3.5 mr-2", isFavorite && "fill-yellow-500 text-yellow-500")} />
                    {isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditingProject(project)} className="px-2.5 py-2 text-xs hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-2.5 py-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
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

  const isExplorerExpanded = expandedSections.has("explorer");
  const isProjectsExpanded = expandedSections.has("projects");
  const isRecentExpanded = expandedSections.has("recent");
  const isFavoritesExpanded = expandedSections.has("favorites");
  const isTagsExpanded = expandedSections.has("tags");

  return (
    <aside
      className={cn(
        "h-screen bg-white dark:bg-[#171717] border-r border-[#e5e5e5] dark:border-[#262626] flex flex-col transition-all duration-150 ease-out select-none",
        collapsed ? "w-[56px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-12 border-b border-[#e5e5e5] dark:border-[#262626] flex items-center",
        collapsed ? "justify-center px-2" : "justify-between px-3"
      )}>
        {!collapsed && (
          <Logo showText={true} />
        )}
        {collapsed && <Logo showText={false} />}
        
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            className="h-7 w-7 text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
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
            className="w-full h-7 text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <>
            {/* EXPLORER Section */}
            <div className="mt-1">
              <button
                onClick={() => toggleSection("explorer")}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors group"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] transition-transform flex-shrink-0",
                    !isExplorerExpanded && "-rotate-90"
                  )}
                />
                <Files className="h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] flex-shrink-0" />
                <span className="text-[10px] font-medium text-[#525252] dark:text-[#d4d4d4] uppercase tracking-wide">
                  Explorer
                </span>
              </button>

              {isExplorerExpanded && (
                <div className="pb-2">
                  {/* New Document Button */}
                  <div className="px-2 py-1">
                    <Button
                      onClick={onNewUpload}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] justify-start gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Document</span>
                    </Button>
                  </div>

                  {/* Documents List */}
                  {documents.length > 0 && (
                    <div className="px-1.5 space-y-0.5">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => onSelectDocument(doc.id)}
                          onMouseEnter={() => setHoveredDoc(doc.id)}
                          onMouseLeave={() => setHoveredDoc(null)}
                          className={cn(
                            "group flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
                            selectedDocId === doc.id
                              ? "bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] font-medium" 
                              : "text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                          )}
                        >
                          <div className="flex-shrink-0">
                            {getFileIcon(doc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs">{doc.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {getStatusIcon(doc.status)}
                              <span className="text-[10px] text-[#525252] dark:text-[#a3a3a3]">{doc.size}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDocument(doc.id);
                            }}
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#525252] dark:text-[#d4d4d4] hover:text-red-600 dark:hover:text-red-400 flex-shrink-0 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {documents.length === 0 && (
                      <div className="px-3 py-8 text-center">
                        <p className="text-xs text-[#525252] dark:text-[#a3a3a3]">No documents</p>
                      </div>
                  )}
                </div>
              )}
            </div>

            {/* PROJECTS Section */}
            {onSelectProject && (
              <div className="mt-1 border-t border-[#e5e5e5] dark:border-[#262626] pt-1">
                <div className="flex items-center justify-between px-3 py-1.5 group">
                  <button
                    onClick={() => toggleSection("projects")}
                    className="flex items-center gap-1.5 flex-1 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors rounded px-1 py-0.5 -ml-1"
                  >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] transition-transform flex-shrink-0",
                          !isProjectsExpanded && "-rotate-90"
                        )}
                      />
                      <FolderTree className="h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] flex-shrink-0" />
                      <span className="text-[10px] font-medium text-[#525252] dark:text-[#d4d4d4] uppercase tracking-wide">
                        Projects
                      </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setProjectDialogOpen(true)}
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {isProjectsExpanded && (
                  <div className="pb-2">
                    {/* All Documents */}
                    <div className="px-1.5 pt-1">
                      <button
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                          selectedProjectId === null 
                            ? "bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] font-medium" 
                            : "text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                        )}
                        onClick={() => onSelectProject(null)}
                      >
                        <Folder className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">All Documents</span>
                      </button>
                    </div>

                    {/* Projects Tree */}
                    <div className="px-1.5 space-y-0.5">
                      {loadingProjects ? (
                        <div className="px-2.5 py-3 text-center">
                          <div className="h-3.5 w-3.5 border-2 border-[#e5e5e5] dark:border-[#262626] border-t-[#171717] dark:border-t-[#fafafa] rounded-full animate-spin mx-auto" />
                        </div>
                      ) : (
                        projects.map((project) => renderProject(project))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RECENT Section */}
            <div className="mt-1 border-t border-[#e5e5e5] dark:border-[#262626] pt-1">
              <button
                onClick={() => toggleSection("recent")}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors group"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] transition-transform flex-shrink-0",
                    !isRecentExpanded && "-rotate-90"
                  )}
                />
                <Clock className="h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] flex-shrink-0" />
                <span className="text-[10px] font-medium text-[#525252] dark:text-[#d4d4d4] uppercase tracking-wide">
                  Recent
                </span>
              </button>

              {isRecentExpanded && (
                <div className="pb-2">
                  {loadingRecent ? (
                    <div className="px-2.5 py-3 text-center">
                      <Loader2 className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4] animate-spin mx-auto" />
                    </div>
                  ) : recentDocuments.length > 0 ? (
                    <div className="px-1.5 space-y-0.5">
                      {recentDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => onSelectDocument(doc.id)}
                          className={cn(
                            "group flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
                            selectedDocId === doc.id
                              ? "bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] font-medium" 
                              : "text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                          )}
                        >
                          <div className="flex-shrink-0">
                            {getFileIcon(doc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs">{doc.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-[#525252] dark:text-[#a3a3a3]">No recent documents</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FAVORITES Section */}
            {onSelectProject && (
              <div className="mt-1 border-t border-[#e5e5e5] dark:border-[#262626] pt-1">
                <button
                  onClick={() => toggleSection("favorites")}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors group"
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] transition-transform flex-shrink-0",
                      !isFavoritesExpanded && "-rotate-90"
                    )}
                  />
                  <Star className="h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] flex-shrink-0 fill-yellow-500 text-yellow-500" />
                  <span className="text-[10px] font-medium text-[#525252] dark:text-[#d4d4d4] uppercase tracking-wide">
                    Favorites
                  </span>
                </button>

                {isFavoritesExpanded && (
                  <div className="pb-2">
                    {loadingFavorites ? (
                      <div className="px-2.5 py-3 text-center">
                        <Loader2 className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4] animate-spin mx-auto" />
                      </div>
                    ) : favoriteProjects.length > 0 ? (
                      <div className="px-1.5 space-y-0.5">
                        {favoriteProjects.map((project) => (
                          <div
                            key={project.id}
                            onClick={() => onSelectProject?.(project.id)}
                            className={cn(
                              "group flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
                              selectedProjectId === project.id
                                ? "bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] font-medium" 
                                : "text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                            )}
                          >
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                            <span className="flex-1 truncate">{project.name}</span>
                            {project.documentCount !== undefined && project.documentCount > 0 && (
                              <span className="text-[10px] text-[#525252] dark:text-[#a3a3a3] font-medium tabular-nums">
                                {project.documentCount}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-4 text-center">
                        <p className="text-xs text-[#525252] dark:text-[#a3a3a3]">No favorites</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAGS Section */}
            <div className="mt-1 border-t border-[#e5e5e5] dark:border-[#262626] pt-1">
              <button
                onClick={() => toggleSection("tags")}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors group"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] transition-transform flex-shrink-0",
                    !isTagsExpanded && "-rotate-90"
                  )}
                />
                <Tag className="h-3.5 w-3.5 text-[#525252] dark:text-[#d4d4d4] flex-shrink-0" />
                <span className="text-[10px] font-medium text-[#525252] dark:text-[#d4d4d4] uppercase tracking-wide">
                  Tags
                </span>
              </button>

              {isTagsExpanded && (
                <div className="pb-2">
                  {loadingTags ? (
                    <div className="px-2.5 py-3 text-center">
                      <Loader2 className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4] animate-spin mx-auto" />
                    </div>
                  ) : tags.length > 0 ? (
                    <div className="px-1.5 space-y-0.5">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagClick(tag.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] text-[#525252] dark:text-[#d4d4d4]"
                        >
                          <div
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color || "#6b7280" }}
                          />
                          <span className="flex-1 truncate">{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-[#525252] dark:text-[#a3a3a3]">No tags</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </>
        )}

        {/* Collapsed Icons */}
        {collapsed && (
          <div className="py-1 space-y-1">
            <button
              onClick={onNewUpload}
              className="w-full flex items-center justify-center h-8 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors"
              title="New Document"
            >
              <Plus className="h-4 w-4" />
            </button>
            {onSelectProject && (
              <button
                onClick={() => setProjectDialogOpen(true)}
                className="w-full flex items-center justify-center h-8 text-[#525252] dark:text-[#d4d4d4] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors"
                title="New Project"
              >
                <Folder className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[#e5e5e5] dark:border-[#262626]">
          <div className="px-3 py-2.5">
            <div className="relative pl-3">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-[#737373]/20 dark:bg-[#a3a3a3]/20 rounded-full" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Secure</p>
                  <div className="relative">
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                    <div className="absolute inset-0 w-1 h-1 rounded-full bg-green-500 animate-ping opacity-75" />
                  </div>
                </div>
                <p className="text-[10px] text-[#525252] dark:text-[#a3a3a3] font-normal leading-tight tracking-wide uppercase">Encrypted</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {collapsed && (
        <div className="border-t border-[#e5e5e5] dark:border-[#262626] p-2">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-60" />
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
