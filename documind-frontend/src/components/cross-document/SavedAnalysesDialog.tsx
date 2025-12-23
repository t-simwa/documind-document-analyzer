import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  FileSearch, 
  Loader2, 
  GitCompare, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare,
  Sparkles,
  Clock
} from "lucide-react";
import { savedAnalysesApi } from "@/services/api";
import type { SavedCrossDocumentAnalysis } from "@/utils/crossDocumentStorage";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SavedAnalysesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAnalysis: (documentIds: string[]) => void;
}

export const SavedAnalysesDialog = ({
  open,
  onOpenChange,
  onSelectAnalysis,
}: SavedAnalysesDialogProps) => {
  const [analyses, setAnalyses] = useState<SavedCrossDocumentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAnalyses();
    }
  }, [open]);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      const saved = await savedAnalysesApi.list();
      setAnalyses(saved);
    } catch (error) {
      console.error("Failed to load saved analyses:", error);
      toast({
        title: "Error",
        description: "Failed to load saved analyses.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (analysis: SavedCrossDocumentAnalysis) => {
    onSelectAnalysis(analysis.documentIds);
    onOpenChange(false);
  };

  const handleDelete = async (analysis: SavedCrossDocumentAnalysis, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(analysis.id);
    try {
      await savedAnalysesApi.delete(analysis.id);
      setAnalyses((prev) => prev.filter((a) => a.id !== analysis.id));
      toast({
        title: "Analysis deleted",
        description: "The saved analysis has been deleted.",
      });
    } catch (error) {
      console.error("Failed to delete analysis:", error);
      toast({
        title: "Error",
        description: "Failed to delete analysis.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa] flex items-center gap-1.5">
              <div className="p-1 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                <FileSearch className="h-3 w-3 text-[#171717] dark:text-[#fafafa]" />
              </div>
              Saved Analyses
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-4 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                  <Loader2 className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3] animate-spin" />
                </div>
              </div>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] font-medium mt-3">Loading analyses...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="relative mb-4">
                <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                  <Sparkles className="h-5 w-5 text-[#737373] dark:text-[#a3a3a3]" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-1.5">No saved analyses yet</h3>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] text-center max-w-sm leading-relaxed">
                Start comparing documents to see your saved analyses here.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    onClick={() => handleSelect(analysis)}
                    className="group relative p-3 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-all duration-200 cursor-pointer"
                  >
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Document names */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {analysis.documentNames.map((name, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-[10px] font-normal px-1.5 py-0.5 bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]"
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Analysis features */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {analysis.hasComparison && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                              <div className="p-0.5 rounded-md bg-blue-500/10">
                                <GitCompare className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span>Comparison</span>
                            </div>
                          )}
                          {analysis.hasPatterns && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                              <div className="p-0.5 rounded-md bg-purple-500/10">
                                <TrendingUp className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span>Patterns</span>
                            </div>
                          )}
                          {analysis.hasContradictions && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                              <div className="p-0.5 rounded-md bg-orange-500/10">
                                <AlertTriangle className="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <span>Contradictions</span>
                            </div>
                          )}
                          {analysis.hasMessages && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                              <div className="p-0.5 rounded-md bg-green-500/10">
                                <MessageSquare className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                              </div>
                              <span>Chat</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                          <Clock className="h-2.5 w-2.5" />
                          <span>
                            Saved {format(new Date(analysis.savedAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(analysis, e)}
                        disabled={deletingId === analysis.id}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#737373] dark:text-[#a3a3a3] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] shrink-0"
                      >
                        {deletingId === analysis.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-7 text-xs border-[#e5e5e5] dark:border-[#262626]">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
