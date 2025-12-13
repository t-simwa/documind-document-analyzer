import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Search, Layers } from "lucide-react";
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
}

export const DocumentListView = ({ projectId, onDocumentSelect, onCompareDocuments }: DocumentListViewProps) => {
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
  }, [filters, sortField, sortDirection, page]);

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
      await documentsApi.delete(id);
      await loadData();
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
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
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} {total === 1 ? "document" : "documents"}
              {selectedIds.size > 0 && (
                <span className="ml-2 text-foreground font-medium">
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
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                Compare Documents
              </Button>
            )}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Filter documents by various criteria
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
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
                className="gap-2"
              >
                Actions
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs bg-background/50">
                  {selectedIds.size}
                </Badge>
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => handleSearch("")}
              >
                <X className="h-3.5 w-3.5" />
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
              <div className="h-8 w-8 border-2 border-muted border-t-foreground rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading documents...</p>
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
        <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-6 py-3">
            <p className="text-sm text-muted-foreground">
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
