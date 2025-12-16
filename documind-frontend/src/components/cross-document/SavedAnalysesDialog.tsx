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
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-b from-background to-background/95">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <FileSearch className="h-4 w-4 text-primary" />
              </div>
              Saved Analyses
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-medium mt-4">Loading analyses...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
                  <Sparkles className="h-10 w-10 text-primary/60" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">No saved analyses yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
                Start comparing documents to see your saved analyses here.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    onClick={() => handleSelect(analysis)}
                    className="group relative p-5 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/2 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
                    
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Document names */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {analysis.documentNames.map((name, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-xs font-medium px-2.5 py-1 bg-muted/60 hover:bg-muted border-border/50"
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Analysis features */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {analysis.hasComparison && (
                            <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                              <div className="p-1 rounded-md bg-blue-500/10">
                                <GitCompare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span>Comparison</span>
                            </div>
                          )}
                          {analysis.hasPatterns && (
                            <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                              <div className="p-1 rounded-md bg-purple-500/10">
                                <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span>Patterns</span>
                            </div>
                          )}
                          {analysis.hasContradictions && (
                            <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                              <div className="p-1 rounded-md bg-orange-500/10">
                                <AlertTriangle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <span>Contradictions</span>
                            </div>
                          )}
                          {analysis.hasMessages && (
                            <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                              <div className="p-1 rounded-md bg-green-500/10">
                                <MessageSquare className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              </div>
                              <span>Chat</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Timestamp */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
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
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        {deletingId === analysis.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
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
        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
