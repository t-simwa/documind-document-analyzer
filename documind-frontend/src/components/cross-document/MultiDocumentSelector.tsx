import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, FileText, CircleCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/api";

interface MultiDocumentSelectorProps {
  documents: Document[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  maxSelection?: number;
  minSelection?: number;
  onConfirm?: (selectedIds: Set<string>) => void;
  onCancel?: () => void;
}

export const MultiDocumentSelector = ({
  documents,
  selectedIds,
  onSelectionChange,
  maxSelection,
  minSelection = 2,
  onConfirm,
  onCancel,
}: MultiDocumentSelectorProps) => {
  const [localSelected, setLocalSelected] = useState<Set<string>>(selectedIds);

  useEffect(() => {
    setLocalSelected(selectedIds);
  }, [selectedIds]);

  const handleToggle = (docId: string) => {
    const newSelected = new Set(localSelected);
    
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      if (maxSelection && newSelected.size >= maxSelection) {
        return;
      }
      newSelected.add(docId);
    }
    
    setLocalSelected(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    const readyDocs = documents.filter((d) => d.status === "ready");
    const newSelected = new Set<string>();
    
    if (localSelected.size === readyDocs.length) {
      setLocalSelected(newSelected);
      onSelectionChange(newSelected);
    } else {
      readyDocs.forEach((doc) => {
        if (!maxSelection || newSelected.size < maxSelection) {
          newSelected.add(doc.id);
        }
      });
      setLocalSelected(newSelected);
      onSelectionChange(newSelected);
    }
  };

  const handleRemove = (docId: string) => {
    const newSelected = new Set(localSelected);
    newSelected.delete(docId);
    setLocalSelected(newSelected);
    onSelectionChange(newSelected);
  };

  const readyDocuments = documents.filter((d) => d.status === "ready");
  const canConfirm = localSelected.size >= minSelection;
  const allSelected = readyDocuments.length > 0 && localSelected.size === readyDocuments.length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Compare Documents</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select {minSelection} or more documents to analyze together
                {maxSelection && ` (max ${maxSelection})`}
              </p>
            </div>
          </div>
          {localSelected.size > 0 && (
            <Badge variant="secondary" className="text-xs font-medium">
              {localSelected.size} selected
            </Badge>
          )}
        </div>
      </div>

      {/* Selected documents bar */}
      {localSelected.size > 0 && (
        <div className="flex-shrink-0 border-b bg-muted/30 px-6 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Selected:</span>
            {Array.from(localSelected).map((docId) => {
              const doc = documents.find((d) => d.id === docId);
              if (!doc) return null;
              return (
                <Badge
                  key={docId}
                  variant="secondary"
                  className="text-xs font-normal flex items-center gap-1.5 pr-1 py-1"
                >
                  <FileText className="h-3 w-3" />
                  <span className="max-w-[200px] truncate">{doc.name}</span>
                  <button
                    onClick={() => handleRemove(docId)}
                    className="ml-0.5 hover:bg-muted rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground">Available Documents</h2>
            {readyDocuments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {readyDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center mb-4 border border-border/50">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium text-foreground mb-1">No documents available</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Documents must be processed and ready before they can be selected for comparison
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {readyDocuments.map((doc) => {
                const isSelected = localSelected.has(doc.id);
                const isDisabled = !isSelected && maxSelection !== undefined && localSelected.size >= maxSelection;

                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer group",
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : isDisabled
                        ? "border-border/50 bg-muted/20 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-border/80 hover:bg-muted/30"
                    )}
                    onClick={() => !isDisabled && handleToggle(doc.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => !isDisabled && handleToggle(doc.id)}
                      className="flex-shrink-0"
                    />
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono uppercase">
                          {doc.type}
                        </span>
                        {doc.metadata?.pageCount && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {doc.metadata.pageCount} page{doc.metadata.pageCount !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CircleCheck className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {onConfirm && (
        <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {localSelected.size < minSelection ? (
                <span>Select at least {minSelection} document{minSelection !== 1 ? "s" : ""} to continue</span>
              ) : (
                <span className="text-foreground font-medium">
                  Ready to analyze {localSelected.size} document{localSelected.size !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onConfirm(localSelected)}
                disabled={!canConfirm}
              >
                Analyze Documents
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
