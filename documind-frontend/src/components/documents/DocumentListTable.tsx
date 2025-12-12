import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
  Tag,
  Folder,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document, DocumentTag, User } from "@/types/api";

interface DocumentListTableProps {
  documents: Document[];
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onDelete: (id: string) => void;
  onTag: (id: string) => void;
  onMove: (id: string) => void;
  onDownload?: (id: string) => void;
  tags: DocumentTag[];
  users: User[];
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

const getFileIcon = (type: string) => {
  const iconClass = "h-4 w-4";
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileText className={cn(iconClass, "text-[#DC2626]")} />;
    case "docx":
    case "doc":
      return <FileText className={cn(iconClass, "text-[#2563EB]")} />;
    case "txt":
      return <FileText className={cn(iconClass, "text-muted-foreground")} />;
    case "md":
      return <FileText className={cn(iconClass, "text-muted-foreground")} />;
    default:
      return <FileText className={cn(iconClass, "text-muted-foreground")} />;
  }
};

const getStatusBadge = (status: Document["status"]) => {
  switch (status) {
    case "ready":
      return (
        <Badge variant="outline" className="gap-1.5 border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          <span className="font-normal">Ready</span>
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="font-normal">Processing</span>
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="gap-1.5 border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          <span className="font-normal">Error</span>
        </Badge>
      );
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const SortableHeader = ({
  field,
  label,
  currentField,
  currentDirection,
  onSort,
}: {
  field: string;
  label: string;
  currentField?: string;
  currentDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}) => {
  if (!onSort) {
    return (
      <TableHead className="h-11 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </TableHead>
    );
  }

  const isActive = currentField === field;
  return (
    <TableHead className="h-11">
      <button
        onClick={() => onSort(field)}
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group",
          isActive && "text-foreground"
        )}
      >
        {label}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {isActive ? (
            currentDirection === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5" />
          )}
        </span>
        {isActive && (
          <span className="opacity-100">
            {currentDirection === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </button>
    </TableHead>
  );
};

export const DocumentListTable = ({
  documents,
  selectedIds,
  onSelect,
  onSelectAll,
  onDelete,
  onTag,
  onMove,
  onDownload,
  tags,
  users,
  sortField,
  sortDirection,
  onSort,
}: DocumentListTableProps) => {
  const allSelected = documents.length > 0 && documents.every((d) => selectedIds.has(d.id));
  const someSelected = documents.some((d) => selectedIds.has(d.id));

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || userId;
  };

  const getTagName = (tagId: string) => {
    return tags.find((t) => t.id === tagId)?.name || tagId;
  };

  const getTagColor = (tagId: string) => {
    return tags.find((t) => t.id === tagId)?.color || "#6b7280";
  };

  return (
    <div className="border-t">
      <Table>
        <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            <TableHead className="w-12 h-11">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <SortableHeader
              field="name"
              label="Name"
              currentField={sortField}
              currentDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              field="status"
              label="Status"
              currentField={sortField}
              currentDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              field="uploadedAt"
              label="Date"
              currentField={sortField}
              currentDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              field="uploadedBy"
              label="Uploaded by"
              currentField={sortField}
              currentDirection={sortDirection}
              onSort={onSort}
            />
            <TableHead className="h-11 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Type
            </TableHead>
            <TableHead className="h-11 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Size
            </TableHead>
            <TableHead className="h-11 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tags
            </TableHead>
            <TableHead className="w-12 h-11"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <FileText className="h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">No documents found</p>
                  <p className="text-xs">Upload a document to get started</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc, index) => (
              <TableRow
                key={doc.id}
                className={cn(
                  "border-b transition-colors",
                  selectedIds.has(doc.id) && "bg-muted/30",
                  "hover:bg-muted/50"
                )}
              >
                <TableCell className="w-12">
                  <Checkbox
                    checked={selectedIds.has(doc.id)}
                    onCheckedChange={(checked) => onSelect(doc.id, checked as boolean)}
                    aria-label={`Select ${doc.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">{getFileIcon(doc.type)}</div>
                    <span className="font-medium text-sm truncate">{doc.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(doc.status)}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(doc.uploadedAt, "MMM d, yyyy")}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {getUserName(doc.uploadedBy)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs font-normal">
                    {doc.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatFileSize(doc.size)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.length > 0 ? (
                      doc.tags.slice(0, 2).map((tagId) => (
                        <Badge
                          key={tagId}
                          variant="outline"
                          className="text-xs font-normal h-5 px-1.5 border-0"
                          style={{
                            backgroundColor: `${getTagColor(tagId)}15`,
                            color: getTagColor(tagId),
                          }}
                        >
                          {getTagName(tagId)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                    {doc.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs font-normal h-5 px-1.5">
                        +{doc.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onDownload && (
                        <>
                          <DropdownMenuItem onClick={() => onDownload(doc.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => onTag(doc.id)}>
                        <Tag className="h-4 w-4 mr-2" />
                        Manage tags
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMove(doc.id)}>
                        <Folder className="h-4 w-4 mr-2" />
                        Move to project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(doc.id)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
