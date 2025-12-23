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
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-7 w-7 p-0 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
            )}
            <div>
              <h1 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Compare Documents</h1>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                Select {minSelection} or more documents to analyze together
                {maxSelection && ` (max ${maxSelection})`}
              </p>
            </div>
          </div>
          {localSelected.size > 0 && (
            <Badge variant="secondary" className="text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
              {localSelected.size} selected
            </Badge>
          )}
        </div>
      </div>

      {/* Selected documents bar */}
      {localSelected.size > 0 && (
        <div className="flex-shrink-0 border-b border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] px-4 py-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">Selected:</span>
            {Array.from(localSelected).map((docId) => {
              const doc = documents.find((d) => d.id === docId);
              if (!doc) return null;
              return (
                <Badge
                  key={docId}
                  variant="secondary"
                  className="text-[10px] font-normal flex items-center gap-1 pr-0.5 py-0.5 bg-white dark:bg-[#171717] border-[#e5e5e5] dark:border-[#262626]"
                >
                  <FileText className="h-2.5 w-2.5" />
                  <span className="max-w-[200px] truncate">{doc.name}</span>
                  <button
                    onClick={() => handleRemove(docId)}
                    className="ml-0.5 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Available Documents</h2>
            {readyDocuments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-[10px] h-6 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {readyDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#171717] flex items-center justify-center mb-3 border border-[#e5e5e5] dark:border-[#262626]">
                <FileText className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
              </div>
              <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-1">No documents available</p>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] max-w-sm">
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
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer group",
                      isSelected
                        ? "border-[#171717] dark:border-[#fafafa] bg-[#fafafa] dark:bg-[#0a0a0a]"
                        : isDisabled
                        ? "border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa]/50 dark:bg-[#0a0a0a]/50 opacity-50 cursor-not-allowed"
                        : "border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:bg-white dark:hover:bg-[#171717]"
                    )}
                    onClick={() => !isDisabled && handleToggle(doc.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => !isDisabled && handleToggle(doc.id)}
                      className="flex-shrink-0"
                    />
                    <FileText className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] font-mono uppercase">
                          {doc.type}
                        </span>
                        {doc.metadata?.pageCount && (
                          <>
                            <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">•</span>
                            <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] font-mono">
                              {doc.metadata.pageCount} page{doc.metadata.pageCount !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CircleCheck className="h-3 w-3 text-[#171717] dark:text-[#fafafa] flex-shrink-0" />
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
        <div className="flex-shrink-0 border-t border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
              {localSelected.size < minSelection ? (
                <span>Select at least {minSelection} document{minSelection !== 1 ? "s" : ""} to continue</span>
              ) : (
                <span className="text-[#171717] dark:text-[#fafafa] font-medium">
                  Ready to analyze {localSelected.size} document{localSelected.size !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel} className="h-7 text-xs border-[#e5e5e5] dark:border-[#262626]">
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onConfirm(localSelected)}
                disabled={!canConfirm}
                className="h-7 text-xs bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
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
