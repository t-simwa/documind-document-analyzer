import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Search, Layers, Clock, Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { DocumentListTable } from "@/components/documents/DocumentListTable";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { BulkActionsDialog } from "@/components/documents/BulkActionsDialog";
import { TagDialog } from "@/components/documents/TagDialog";
import { MoveToProjectDialog } from "@/components/documents/MoveToProjectDialog";
import { ProjectBreadcrumb } from "./ProjectBreadcrumb";
import { documentsApi, tagsApi, usersApi, projectsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Document, DocumentTag, User, FilterParams, SortParams, BulkActionRequest, Project } from "@/types/api";

interface ProjectViewProps {
  projectId: string;
  onDocumentSelect?: (document: Document) => void;
  onCompareDocuments?: () => void;
  onOpenSavedAnalyses?: () => void;
  refreshTrigger?: number;
  onDocumentDeleted?: (id: string) => void;
  onProjectSelect?: (projectId: string | null) => void;
  onRefreshSidebar?: () => void;
}

export const ProjectView = ({
  projectId,
  onDocumentSelect,
  onCompareDocuments,
  onOpenSavedAnalyses,
  refreshTrigger,
  onDocumentDeleted,
  onProjectSelect,
  onRefreshSidebar,
}: ProjectViewProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tags, setTags] = useState<DocumentTag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterParams>({ projectId });
  const [sortField, setSortField] = useState<string>("uploadedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagDialogDocumentId, setTagDialogDocumentId] = useState<string | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveDialogDocumentId, setMoveDialogDocumentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [breadcrumbProjects, setBreadcrumbProjects] = useState<Project[]>([]);
  const { toast } = useToast();

  // Load project and build breadcrumb
  useEffect(() => {
    const loadProject = async () => {
      try {
        const hierarchy = await projectsApi.getHierarchy();
        setProjectHierarchy(hierarchy);
        
        // Find the project in the hierarchy
        const findProject = (projects: Project[], id: string): Project | null => {
          for (const p of projects) {
            if (p.id === id) return p;
            if (p.children) {
              const found = findProject(p.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        
        const foundProject = findProject(hierarchy, projectId);
        if (foundProject) {
          setProject(foundProject);
          
          // Build breadcrumb path
          const buildBreadcrumb = (projects: Project[], targetId: string, path: Project[] = []): Project[] | null => {
            for (const p of projects) {
              const currentPath = [...path, p];
              if (p.id === targetId) {
                return currentPath;
              }
              if (p.children) {
                const found = buildBreadcrumb(p.children, targetId, currentPath);
                if (found) return found;
              }
            }
            return null;
          };
          
          const breadcrumb = buildBreadcrumb(hierarchy, projectId);
          if (breadcrumb) {
            setBreadcrumbProjects(breadcrumb);
          }
        }
      } catch (error) {
        console.error("Failed to load project:", error);
      }
    };
    
    loadProject();
  }, [projectId]);

  // Collect all project IDs (current project + all descendants)
  const getAllProjectIds = useCallback((proj: Project | null): string[] => {
    if (!proj) return [];
    const ids = [proj.id];
    if (proj.children) {
      proj.children.forEach((child) => {
        ids.push(...getAllProjectIds(child));
      });
    }
    return ids;
  }, []);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, projectId }));
  }, [projectId]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortDirection, page, refreshTrigger, project]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Collect all project IDs including current and all descendants
      const allProjectIds = project ? getAllProjectIds(project) : [projectId].filter(Boolean);
      
      // Load documents for all relevant projects
      const allDocs: Document[] = [];
      for (const pid of allProjectIds) {
        try {
          const response = await documentsApi.list({
            projectId: pid,
            field: sortField,
            direction: sortDirection,
            page: 1,
            limit: 1000, // Load all documents for each project
          });
          allDocs.push(...response.documents);
        } catch (error) {
          console.error(`Failed to load documents for project ${pid}:`, error);
        }
      }
      
      // Remove duplicates (in case a document appears in multiple projects)
      const uniqueDocs = Array.from(
        new Map(allDocs.map((doc) => [doc.id, doc])).values()
      );
      
      // Sort documents
      const sorted = uniqueDocs.sort((a, b) => {
        const aVal = a[sortField as keyof Document];
        const bVal = b[sortField as keyof Document];
        if (sortDirection === "asc") {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
      
      // Apply pagination
      const start = (page - 1) * 20;
      const end = start + 20;
      const paginatedDocs = sorted.slice(start, end);
      
      const docsResponse = {
        documents: paginatedDocs,
        pagination: {
          page,
          limit: 20,
          total: sorted.length,
          totalPages: Math.ceil(sorted.length / 20),
          hasNext: end < sorted.length,
          hasPrev: page > 1,
        },
      };

      const [tagsData, usersData] = await Promise.all([
        tagsApi.list(),
        usersApi.list(),
      ]);

      setDocuments(sorted); // Store all documents for filtering by project
      setTotalPages(docsResponse.pagination.totalPages);
      setTotal(docsResponse.pagination.total);
      setTags(tagsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectExpanded = (projectId: string) => {
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

  const renderProjectItem = (proj: Project): JSX.Element => {
    const isExpanded = expandedProjects.has(proj.id);
    const hasChildren = proj.children && proj.children.length > 0;
    const projectDocuments = documents.filter((d) => d.projectId === proj.id);
    
    // Get all documents for this project and its descendants
    const getAllProjectDocumentIds = (project: Project): string[] => {
      const ids = [project.id];
      if (project.children) {
        project.children.forEach((child) => {
          ids.push(...getAllProjectDocumentIds(child));
        });
      }
      return ids;
    };
    
    const allProjectIds = getAllProjectDocumentIds(proj);
    const allProjectDocuments = documents.filter((d) => allProjectIds.includes(d.projectId || ""));

    return (
      <div key={proj.id} className="border-b border-[#e5e5e5] dark:border-[#262626]">
        {/* Project Header Row - Clickable to expand/collapse */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors cursor-pointer",
            isExpanded && "bg-[#fafafa] dark:bg-[#0a0a0a]"
          )}
          onClick={() => toggleProjectExpanded(proj.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleProjectExpanded(proj.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4]" />
            )}
          </Button>
          
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4] flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-[#525252] dark:text-[#d4d4d4] flex-shrink-0" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">{proj.name}</h1>
              <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                ({allProjectDocuments.length})
              </span>
            </div>
            {proj.description && (
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5 truncate">{proj.description}</p>
            )}
          </div>
        </div>

        {/* Expanded Content - Show documents table */}
        {isExpanded && projectDocuments.length > 0 && (
          <div className="bg-white dark:bg-[#171717]">
            <DocumentListTable
              documents={projectDocuments}
              selectedIds={selectedIds}
              onSelect={(id, selected) => {
                const newSelected = new Set(selectedIds);
                if (selected) {
                  newSelected.add(id);
                } else {
                  newSelected.delete(id);
                }
                setSelectedIds(newSelected);
              }}
              onSelectAll={(selected) => {
                if (selected) {
                  setSelectedIds(new Set(projectDocuments.map((d) => d.id)));
                } else {
                  const newSelected = new Set(selectedIds);
                  projectDocuments.forEach((d) => newSelected.delete(d.id));
                  setSelectedIds(newSelected);
                }
              }}
              onDelete={handleDelete}
              onTag={handleTag}
              onMove={handleMove}
              onAnalyze={onDocumentSelect}
              tags={tags}
              users={users}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>
        )}

        {/* Recursively render child projects */}
        {hasChildren && isExpanded && (
          <div className="bg-[#fafafa] dark:bg-[#0a0a0a]">
            {proj.children!.map((child) => renderProjectItem(child))}
          </div>
        )}

        {/* Show empty state if expanded but no documents and no children */}
        {isExpanded && projectDocuments.length === 0 && !hasChildren && (
          <div className="px-4 py-8 text-center bg-white dark:bg-[#171717]">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">No documents in this project</p>
          </div>
        )}
      </div>
    );
  };

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const previousDocuments = documents;
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      await documentsApi.delete(id);

      if (onDocumentDeleted) {
        onDocumentDeleted(id);
      }

      // Wait a bit for backend to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // First reload project hierarchy to get updated structure and counts
      try {
        const hierarchy = await projectsApi.getHierarchy();
        setProjectHierarchy(hierarchy);
        // Find and update the current project in the hierarchy
        const findProject = (projects: Project[], id: string): Project | null => {
          for (const p of projects) {
            if (p.id === id) return p;
            if (p.children) {
              const found = findProject(p.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const foundProject = findProject(hierarchy, projectId);
        if (foundProject) {
          setProject(foundProject);
          // Wait for state to update, then reload documents
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error("Failed to reload project hierarchy:", error);
      }
      
      // Now reload documents with updated project structure
      await loadData();

      // Trigger sidebar refresh to update project counts
      if (onRefreshSidebar) {
        onRefreshSidebar();
      }

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete document:", error);
      await loadData();
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (request: BulkActionRequest) => {
    try {
      await documentsApi.bulkAction(request);
      await loadData();
      setSelectedIds(new Set());
      setBulkActionsOpen(false);
      toast({
        title: "Success",
        description: "Bulk action completed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    }
  };

  const handleTag = (id: string) => {
    setTagDialogDocumentId(id);
    setTagDialogOpen(true);
  };

  const handleMove = (id: string) => {
    setMoveDialogDocumentId(id);
    setMoveDialogOpen(true);
  };

  const handleTagUpdate = async () => {
    await loadData();
    setTagDialogOpen(false);
    setTagDialogDocumentId(null);
  };

  const handleMoveUpdate = async () => {
    setMoveDialogOpen(false);
    setMoveDialogDocumentId(null);
    // Wait a bit for backend to update
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // First reload project hierarchy to get updated structure and counts
    let updatedProject: Project | null = null;
    try {
      const hierarchy = await projectsApi.getHierarchy();
      setProjectHierarchy(hierarchy);
      // Find and update the current project in the hierarchy
      const findProject = (projects: Project[], id: string): Project | null => {
        for (const p of projects) {
          if (p.id === id) return p;
          if (p.children) {
            const found = findProject(p.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      updatedProject = findProject(hierarchy, projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error("Failed to reload project hierarchy:", error);
    }
    
    // Wait for React state to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now reload documents - use updatedProject if available, otherwise project state
    const projectToUse = updatedProject || project;
    if (projectToUse) {
      // Collect all project IDs including current and all descendants
      const allProjectIds = getAllProjectIds(projectToUse);
      
      // Load documents for all relevant projects
      const allDocs: Document[] = [];
      for (const pid of allProjectIds) {
        try {
          const response = await documentsApi.list({
            projectId: pid,
            field: sortField,
            direction: sortDirection,
            page: 1,
            limit: 1000,
          });
          allDocs.push(...response.documents);
        } catch (error) {
          console.error(`Failed to load documents for project ${pid}:`, error);
        }
      }
      
      // Remove duplicates
      const uniqueDocs = Array.from(
        new Map(allDocs.map((doc) => [doc.id, doc])).values()
      );
      
      // Sort documents
      const sorted = uniqueDocs.sort((a, b) => {
        const aVal = a[sortField as keyof Document];
        const bVal = b[sortField as keyof Document];
        if (sortDirection === "asc") {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
      
      setDocuments(sorted);
      setTotal(sorted.length);
      setTotalPages(Math.ceil(sorted.length / 20));
    } else {
      // Fallback to regular loadData
      await loadData();
    }
    
    // Trigger sidebar refresh to update project counts
    if (onRefreshSidebar) {
      onRefreshSidebar();
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, search: query || undefined }));
    setPage(1);
  };

  const availableFileTypes = Array.from(new Set(documents.map((d) => d.type)));

  const activeFiltersCount =
    (filters.status?.length || 0) +
    (filters.fileType?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.uploadedBy?.length || 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.search ? 1 : 0);

  // If project has no children, show documents directly
  const hasChildren = project?.children && project.children.length > 0;
  const projectDocuments = documents.filter((d) => d.projectId === projectId);

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <ProjectBreadcrumb projects={breadcrumbProjects} onProjectClick={onProjectSelect} />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">{project?.name || "Project"}</h1>
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
              {hasChildren
                ? `${project?.children?.length || 0} ${(project?.children?.length || 0) === 1 ? "sub-project" : "sub-projects"}`
                : `${projectDocuments.length} ${projectDocuments.length === 1 ? "document" : "documents"}`}
              {selectedIds.size > 0 && (
                <span className="ml-2 text-[#171717] dark:text-[#fafafa] font-medium">
                  • {selectedIds.size} selected
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onCompareDocuments && (
              <Button
                onClick={onCompareDocuments}
                size="sm"
                className="gap-1.5 h-7 text-xs border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
              >
                <Layers className="h-3 w-3" />
                Compare Documents
              </Button>
            )}
            {onOpenSavedAnalyses && (
              <Button
                onClick={onOpenSavedAnalyses}
                size="sm"
                className="gap-1.5 h-7 text-xs border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
              >
                <Clock className="h-3 w-3" />
                Saved Analyses
              </Button>
            )}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                  <Filter className="h-3 w-3" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                <SheetHeader className="pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
                  <SheetTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Filters</SheetTitle>
                  <SheetDescription className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                    Filter documents by various criteria
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <DocumentFilters
                    filters={filters}
                    onFiltersChange={(newFilters) => {
                      setFilters(newFilters);
                      setPage(1);
                    }}
                    tags={tags}
                    users={users}
                    availableFileTypes={availableFileTypes}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {selectedIds.size > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setBulkActionsOpen(true)}
                className="gap-1.5 h-7 text-xs bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
              >
                Actions
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-[#fafafa] dark:bg-[#171717] text-[#171717] dark:text-[#fafafa]">
                  {selectedIds.size}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 border-2 border-[#e5e5e5] dark:border-[#262626] border-t-[#171717] dark:border-t-[#fafafa] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading documents...</p>
            </div>
          </div>
        ) : hasChildren ? (
          // Show child projects as expandable sections
          <div className="bg-white dark:bg-[#171717]">
            {project?.children?.map((child) => renderProjectItem(child))}
          </div>
        ) : (
          // Show documents directly if no children
          <DocumentListTable
            documents={projectDocuments}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onDelete={handleDelete}
            onTag={handleTag}
            onMove={handleMove}
            onAnalyze={onDocumentSelect}
            tags={tags}
            users={users}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Pagination */}
      {!hasChildren && totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} documents
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className={cn(page === 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className={cn(page === totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <BulkActionsDialog
        open={bulkActionsOpen}
        onOpenChange={setBulkActionsOpen}
        selectedIds={Array.from(selectedIds)}
        onAction={handleBulkAction}
        tags={tags}
        projects={[]} // TODO: Load projects for move action
      />
      {tagDialogDocumentId && (
        <TagDialog
          open={tagDialogOpen}
          onOpenChange={setTagDialogOpen}
          documentId={tagDialogDocumentId}
          onUpdate={handleTagUpdate}
        />
      )}
      {moveDialogDocumentId && (
        <MoveToProjectDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          documentId={moveDialogDocumentId}
          onUpdate={handleMoveUpdate}
        />
      )}
    </div>
  );
};

