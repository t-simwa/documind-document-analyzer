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
import { Trash2, FileText, Clock, Layers, BarChart3, AlertCircle, MessageCircle } from "lucide-react";
import { getAllSavedCrossDocumentAnalyses, deleteSavedCrossDocumentAnalysis, type SavedCrossDocumentAnalysis } from "@/utils/crossDocumentStorage";
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
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAnalyses();
    }
  }, [open]);

  const loadAnalyses = () => {
    setIsLoading(true);
    try {
      const saved = getAllSavedCrossDocumentAnalyses();
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

  const handleDelete = (analysis: SavedCrossDocumentAnalysis, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      deleteSavedCrossDocumentAnalysis(analysis.documentIds);
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Saved cross-document analyses
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/40 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Loading analyses...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/40 mb-3">
                <FileText className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-xs font-medium text-foreground mb-1">No saved analyses</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Cross-document analyses will be saved automatically when you analyze documents
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    onClick={() => handleSelect(analysis)}
                    className="group p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {analysis.documentNames.map((name, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs font-normal">
                              {name}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {analysis.hasComparison && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Layers className="h-3 w-3" />
                              <span>Comparison</span>
                            </div>
                          )}
                          {analysis.hasPatterns && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <BarChart3 className="h-3 w-3" />
                              <span>Patterns</span>
                            </div>
                          )}
                          {analysis.hasContradictions && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <AlertCircle className="h-3 w-3" />
                              <span>Contradictions</span>
                            </div>
                          )}
                          {analysis.hasMessages && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3" />
                              <span>Chat</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Saved {format(new Date(analysis.savedAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(analysis, e)}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

