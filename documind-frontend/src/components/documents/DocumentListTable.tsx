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
  MessageSquare,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document, DocumentTag, User } from "@/types/api";
import { ShareDialog } from "@/components/sharing/ShareDialog";

interface DocumentListTableProps {
  documents: Document[];
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onDelete: (id: string) => void;
  onTag: (id: string) => void;
  onMove: (id: string) => void;
  onDownload?: (id: string) => void;
  onAnalyze?: (document: Document) => void;
  tags: DocumentTag[];
  users: User[];
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

const getFileIcon = (type: string) => {
  const iconClass = "h-3 w-3";
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileText className={cn(iconClass, "text-[#DC2626]")} />;
    case "docx":
    case "doc":
      return <FileText className={cn(iconClass, "text-[#2563EB]")} />;
    case "txt":
      return <FileText className={cn(iconClass, "text-[#737373] dark:text-[#a3a3a3]")} />;
    case "md":
      return <FileText className={cn(iconClass, "text-[#737373] dark:text-[#a3a3a3]")} />;
    default:
      return <FileText className={cn(iconClass, "text-[#737373] dark:text-[#a3a3a3]")} />;
  }
};

const getStatusBadge = (status: Document["status"]) => {
  switch (status) {
    case "ready":
      return (
        <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400 h-4 text-[10px]">
          <CheckCircle2 className="h-2 w-2" />
          <span className="font-normal">Ready</span>
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400 h-4 text-[10px]">
          <Loader2 className="h-2 w-2 animate-spin" />
          <span className="font-normal">Processing</span>
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400 h-4 text-[10px]">
          <AlertCircle className="h-2 w-2" />
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
      <TableHead className="h-8 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">
        {label}
      </TableHead>
    );
  }

  const isActive = currentField === field;
  return (
    <TableHead className="h-8">
      <button
        onClick={() => onSort(field)}
        className={cn(
          "flex items-center gap-1 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors group",
          isActive && "text-[#171717] dark:text-[#fafafa]"
        )}
      >
        {label}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {isActive ? (
            currentDirection === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3" />
          )}
        </span>
        {isActive && (
          <span className="opacity-100">
            {currentDirection === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
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
  onAnalyze,
  tags,
  users,
  sortField,
  sortDirection,
  onSort,
}: DocumentListTableProps) => {
  const allSelected = documents.length > 0 && documents.every((d) => selectedIds.has(d.id));
  const someSelected = documents.some((d) => selectedIds.has(d.id));
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState<Document | null>(null);

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
    <div className="border-t border-[#e5e5e5] dark:border-[#262626]">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#e5e5e5] dark:border-[#262626] hover:bg-transparent">
            <TableHead className="w-12 h-8">
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
            <TableHead className="h-8 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">
              Type
            </TableHead>
            <TableHead className="h-8 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">
              Size
            </TableHead>
            <TableHead className="h-8 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">
              Tags
            </TableHead>
            <TableHead className="w-12 h-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-[#737373] dark:text-[#a3a3a3]">
                  <FileText className="h-6 w-6 opacity-50" />
                  <p className="text-xs font-medium">No documents found</p>
                  <p className="text-[10px]">Upload a document to get started</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc, index) => (
              <TableRow
                key={doc.id}
                className={cn(
                  "border-b border-[#e5e5e5] dark:border-[#262626] transition-colors h-8",
                  selectedIds.has(doc.id) && "bg-[#fafafa] dark:bg-[#0a0a0a]",
                  "hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                )}
              >
                <TableCell className="w-12 py-2">
                  <Checkbox
                    checked={selectedIds.has(doc.id)}
                    onCheckedChange={(checked) => onSelect(doc.id, checked as boolean)}
                    aria-label={`Select ${doc.name}`}
                  />
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-shrink-0">{getFileIcon(doc.type)}</div>
                    {doc.status === "ready" && onAnalyze ? (
                      <button
                        onClick={() => onAnalyze(doc)}
                        className="font-medium text-xs truncate text-left text-[#171717] dark:text-[#fafafa] hover:text-[#171717]/80 dark:hover:text-[#fafafa]/80 transition-colors cursor-pointer"
                        title="Click to analyze document"
                      >
                        {doc.name}
                      </button>
                    ) : (
                      <span className="font-medium text-xs truncate text-[#171717] dark:text-[#fafafa]">{doc.name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  {getStatusBadge(doc.status)}
                </TableCell>
                <TableCell className="py-2">
                  <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    {format(doc.uploadedAt, "MMM d, yyyy")}
                  </span>
                </TableCell>
                <TableCell className="py-2">
                  <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    {getUserName(doc.uploadedBy)}
                  </span>
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant="outline" className="font-mono text-[10px] font-normal h-4 border-[#e5e5e5] dark:border-[#262626]">
                    {doc.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] font-mono">
                    {formatFileSize(doc.size)}
                  </span>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.length > 0 ? (
                      doc.tags.slice(0, 2).map((tagId) => (
                        <Badge
                          key={tagId}
                          variant="outline"
                          className="text-[10px] font-normal h-3.5 px-1 border-0"
                          style={{
                            backgroundColor: `${getTagColor(tagId)}15`,
                            color: getTagColor(tagId),
                          }}
                        >
                          {getTagName(tagId)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-[#737373]/60 dark:text-[#a3a3a3]/60">—</span>
                    )}
                    {doc.tags.length > 2 && (
                      <Badge variant="outline" className="text-[10px] font-normal h-3.5 px-1 border-[#e5e5e5] dark:border-[#262626]">
                        +{doc.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-[#171717] border-[#e5e5e5] dark:border-[#262626]">
                      {doc.status === "ready" && onAnalyze && (
                        <>
                          <DropdownMenuItem onClick={() => onAnalyze(doc)} className="text-xs px-2.5 py-2">
                            <MessageSquare className="h-3 w-3 mr-2" />
                            Analyze
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#e5e5e5] dark:bg-[#262626]" />
                        </>
                      )}
                      {onDownload && (
                        <>
                          <DropdownMenuItem onClick={() => onDownload(doc.id)} className="text-xs px-2.5 py-2">
                            <Download className="h-3 w-3 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#e5e5e5] dark:bg-[#262626]" />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => onTag(doc.id)} className="text-xs px-2.5 py-2">
                        <Tag className="h-3 w-3 mr-2" />
                        Manage tags
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMove(doc.id)} className="text-xs px-2.5 py-2">
                        <Folder className="h-3 w-3 mr-2" />
                        Move to project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#e5e5e5] dark:bg-[#262626]" />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDocForShare(doc);
                          setShareDialogOpen(true);
                        }}
                        className="text-xs px-2.5 py-2"
                      >
                        <Share2 className="h-3 w-3 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#e5e5e5] dark:bg-[#262626]" />
                      <DropdownMenuItem
                        onClick={() => onDelete(doc.id)}
                        className="text-xs px-2.5 py-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
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

      {/* Share Dialog */}
      {selectedDocForShare && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          documentId={selectedDocForShare.id}
          documentName={selectedDocForShare.name}
          users={users}
        />
      )}
    </div>
  );
};
