import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Download, FileCode, FileJson, Loader2, FileType2, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportApi } from "@/services/api";
import type { ExportFormat, DocumentSummary } from "@/types/api";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  documentName?: string;
  chatMessages?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  summary?: DocumentSummary;
  onExportComplete?: () => void;
}

export const ExportDialog = ({
  open,
  onOpenChange,
  documentId,
  documentName,
  chatMessages = [],
  summary,
  onExportComplete,
}: ExportDialogProps) => {
  const [exportType, setExportType] = useState<"chat" | "summary" | "both">("chat");
  const [format, setFormat] = useState<ExportFormat>("txt");
  const [isExporting, setIsExporting] = useState(false);
  const [includeAnnotations, setIncludeAnnotations] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!documentId) {
      toast({
        title: "Error",
        description: "Document ID is required for export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      let blob: Blob;
      let filename = documentName || "export";

      if (exportType === "chat" && chatMessages.length > 0) {
        blob = await exportApi.exportChatHistory(documentId, chatMessages, format);
        filename = `${filename}_chat_history.${format}`;
      } else if (exportType === "summary" && summary) {
        blob = await exportApi.exportSummary(documentId, summary, format);
        filename = `${filename}_summary.${format}`;
      } else if (exportType === "both") {
        let content = "";
        if (format === "json") {
          content = JSON.stringify(
            {
              chatHistory: chatMessages,
              summary: summary,
            },
            null,
            2
          );
        } else {
          if (summary) {
            content += `EXECUTIVE SUMMARY\n${"=".repeat(50)}\n\n${summary.executiveSummary}\n\n\nKEY POINTS\n${"=".repeat(50)}\n\n${summary.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n")}\n\n\n`;
          }
          if (chatMessages.length > 0) {
            content += `\n\nCHAT HISTORY\n${"=".repeat(50)}\n\n`;
            content += chatMessages
              .map((msg) => {
                const timestamp = new Date(msg.timestamp).toLocaleString();
                return `[${timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`;
              })
              .join("\n\n");
          }
        }
        blob = new Blob([content], {
          type: format === "json" ? "application/json" : "text/plain",
        });
        filename = `${filename}_complete.${format}`;
      } else {
        toast({
          title: "Error",
          description: "No content available to export.",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `File "${filename}" has been downloaded.`,
      });

      onExportComplete?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToPDF = async () => {
    if (!documentId) return;

    setIsExporting(true);
    try {
      let content = "";
      if (summary) {
        content += `EXECUTIVE SUMMARY\n\n${summary.executiveSummary}\n\n\nKEY POINTS\n\n${summary.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n")}\n\n`;
      }
      if (chatMessages.length > 0) {
        content += `\n\nCHAT HISTORY\n\n`;
        content += chatMessages
          .map((msg) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            return `[${timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`;
          })
          .join("\n\n");
      }

      const blob = await exportApi.exportToPDF(documentId, content);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentName || "export"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "PDF has been downloaded.",
      });

      onExportComplete?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToWord = async () => {
    if (!documentId) return;

    setIsExporting(true);
    try {
      let content = "";
      if (summary) {
        content += `EXECUTIVE SUMMARY\n\n${summary.executiveSummary}\n\n\nKEY POINTS\n\n${summary.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n")}\n\n`;
      }
      if (chatMessages.length > 0) {
        content += `\n\nCHAT HISTORY\n\n`;
        content += chatMessages
          .map((msg) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            return `[${timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`;
          })
          .join("\n\n");
      }

      const blob = await exportApi.exportToWord(documentId, content);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentName || "export"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Word document has been downloaded.",
      });

      onExportComplete?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export to Word. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              Export content
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Export Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">What to export</Label>
            <div className="space-y-1">
              <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as typeof exportType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="chat" id="chat" />
                  <Label htmlFor="chat" className="text-xs font-normal cursor-pointer flex-1 text-[#171717] dark:text-[#fafafa]">
                    Chat History {chatMessages.length > 0 && (
                      <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] ml-1">
                        ({chatMessages.length} messages)
                      </span>
                    )}
                  </Label>
                </div>
                {summary && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="summary" id="summary" />
                    <Label htmlFor="summary" className="text-xs font-normal cursor-pointer text-[#171717] dark:text-[#fafafa]">
                      Summary
                    </Label>
                  </div>
                )}
                {summary && chatMessages.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="text-xs font-normal cursor-pointer text-[#171717] dark:text-[#fafafa]">
                      Both (Chat + Summary)
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>
          </div>

          {/* Format Selection */}
          {(exportType === "chat" || exportType === "summary" || exportType === "both") && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Format</Label>
              <div className="space-y-1">
                <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="txt" id="txt" />
                    <Label htmlFor="txt" className="text-xs font-normal cursor-pointer flex items-center gap-1.5 text-[#171717] dark:text-[#fafafa]">
                      <FileType2 className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      Text (.txt)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="text-xs font-normal cursor-pointer flex items-center gap-1.5 text-[#171717] dark:text-[#fafafa]">
                      <FileJson className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      JSON (.json)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="annotations"
                checked={includeAnnotations}
                onCheckedChange={(checked) => setIncludeAnnotations(checked as boolean)}
              />
              <Label htmlFor="annotations" className="text-xs font-normal cursor-pointer text-[#171717] dark:text-[#fafafa]">
                Include annotations and comments
              </Label>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Quick Export */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Quick export</Label>
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportToPDF}
                  disabled={isExporting || (!summary && chatMessages.length === 0)}
                  className="h-8 text-xs justify-start border-[#e5e5e5] dark:border-[#262626]"
                >
                  <FileDown className="h-3 w-3 mr-1.5 text-[#737373] dark:text-[#a3a3a3]" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportToWord}
                  disabled={isExporting || (!summary && chatMessages.length === 0)}
                  className="h-8 text-xs justify-start border-[#e5e5e5] dark:border-[#262626]"
                >
                  <FileCode className="h-3 w-3 mr-1.5 text-[#737373] dark:text-[#a3a3a3]" />
                  Word
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isExporting}
            className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
          >
            {isExporting ? (
              <>
                <span className="mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-3 w-3 mr-1.5" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
