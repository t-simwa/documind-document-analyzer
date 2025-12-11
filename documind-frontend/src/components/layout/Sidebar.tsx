import { useState } from "react";
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
  File
} from "lucide-react";

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
  collapsed,
  onToggleCollapse,
}: SidebarProps) => {
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);

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
      <div className="flex-1 overflow-y-auto px-2">
        {!collapsed && documents.length > 0 && (
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2 mt-2">
            Documents
          </p>
        )}
        
        <div className="space-y-0.5">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              onMouseEnter={() => setHoveredDoc(doc.id)}
              onMouseLeave={() => setHoveredDoc(null)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors duration-150 group text-left",
                selectedDocId === doc.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {/* File Icon */}
              <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center">
                {getFileIcon(doc.type)}
              </div>

              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate">{doc.name}</p>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(doc.status)}
                      <span className="text-[11px] text-muted-foreground">{doc.size}</span>
                    </div>
                  </div>

                  {/* Delete */}
                  {hoveredDoc === doc.id && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {documents.length === 0 && !collapsed && (
          <div className="px-2 py-6 text-center">
            <p className="text-xs text-muted-foreground">No documents</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>Secure Mode</span>
          </div>
        </div>
      )}
    </aside>
  );
};
