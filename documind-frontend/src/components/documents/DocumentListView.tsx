import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Search, Layers, Clock } from "lucide-react";
import { DocumentListTable } from "./DocumentListTable";
import { DocumentFilters } from "./DocumentFilters";
import { BulkActionsDialog } from "./BulkActionsDialog";
import { TagDialog } from "./TagDialog";
import { MoveToProjectDialog } from "./MoveToProjectDialog";
import { documentsApi, tagsApi, usersApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Document, DocumentTag, User, FilterParams, SortParams, BulkActionRequest } from "@/types/api";

interface DocumentListViewProps {
  projectId?: string | null;
  onDocumentSelect?: (document: Document) => void;
  onCompareDocuments?: () => void;
  onOpenSavedAnalyses?: () => void;
  refreshTrigger?: number; // Add refresh trigger to force reload when documents are deleted elsewhere
  onDocumentDeleted?: (id: string) => void; // Callback to notify parent when document is deleted
}

export const DocumentListView = ({ projectId, onDocumentSelect, onCompareDocuments, onOpenSavedAnalyses, refreshTrigger, onDocumentDeleted }: DocumentListViewProps) => {
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
  const { toast } = useToast();

  useEffect(() => {
    setFilters((prev) => ({ ...prev, projectId }));
  }, [projectId]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortDirection, page, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsResponse, tagsData, usersData] = await Promise.all([
        documentsApi.list({
          ...filters,
          field: sortField,
          direction: sortDirection,
          page,
          limit: 20,
        }),
        tagsApi.list(),
        usersApi.list(),
      ]);

      setDocuments(docsResponse.documents);
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
      // Optimistically update local state immediately
      const previousDocuments = documents;
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // Call API to delete
      await documentsApi.delete(id);
      
      // Notify parent component
      if (onDocumentDeleted) {
        onDocumentDeleted(id);
      }
      
      // Reload data to ensure consistency with server
      await loadData();
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete document:", error);
      // Restore previous state on error
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
    await loadData();
    setMoveDialogOpen(false);
    setMoveDialogDocumentId(null);
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Documents</h1>
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
              {total} {total === 1 ? "document" : "documents"}
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

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 h-8 text-xs border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                onClick={() => handleSearch("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Document Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="h-6 w-6 border-2 border-[#e5e5e5] dark:border-[#262626] border-t-[#171717] dark:border-t-[#fafafa] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading documents...</p>
            </div>
          </div>
        ) : (
          <DocumentListTable
            documents={documents}
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
      {totalPages > 1 && (
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
                    className={cn(
                      page === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                        isActive={pageNum === page}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 7 && page < totalPages - 3 && (
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
                    className={cn(
                      page === totalPages && "pointer-events-none opacity-50"
                    )}
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
      />

      <TagDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        documentId={tagDialogDocumentId}
        onUpdate={handleTagUpdate}
        tags={tags}
      />

      <MoveToProjectDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        documentId={moveDialogDocumentId}
        onUpdate={handleMoveUpdate}
      />
    </div>
  );
};
