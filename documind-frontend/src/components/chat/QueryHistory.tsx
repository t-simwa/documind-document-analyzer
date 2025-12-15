import { useState, useEffect, useCallback } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryApi } from "@/services/api";
import type { QueryHistoryItem } from "@/types/api";
import { cn } from "@/lib/utils";

interface QueryHistoryProps {
  onSelectQuery: (query: string) => void;
  documentId?: string;
  collectionName?: string;
}

export const QueryHistory = ({
  onSelectQuery,
  documentId,
  collectionName,
}: QueryHistoryProps) => {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await queryApi.getHistory();
      // Filter by document if documentId is provided
      let filteredHistory = response.items;
      if (documentId) {
        filteredHistory = response.items.filter((item) =>
          item.document_ids.includes(documentId)
        );
      }
      // Filter by collection if collectionName is provided
      if (collectionName) {
        filteredHistory = filteredHistory.filter(
          (item) => item.collection_name === collectionName
        );
      }
      // Sort by most recent first
      filteredHistory.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      setHistory(filteredHistory);
    } catch (err) {
      console.error("Failed to load query history:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [documentId, collectionName]);

  useEffect(() => {
    if (isExpanded) {
      loadHistory();
    }
  }, [isExpanded, loadHistory]);

  if (!isExpanded) {
    return (
      <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground justify-between"
        >
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>Query History</span>
          </div>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Query History</span>
          {history.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              ({history.length})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="h-6 w-6 p-0 hover:bg-muted/50"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>

      <div className="max-h-64 overflow-y-auto px-4 pb-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              className="h-7 text-xs"
            >
              Retry
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground">
              No query history found
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectQuery(item.query)}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg border border-border/50",
                  "bg-card/50 hover:bg-card hover:border-border hover:shadow-sm",
                  "transition-all duration-200 group"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/90 group-hover:text-foreground line-clamp-2 mb-1.5">
                      {item.query}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>
                        {new Date(item.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.document_ids.length > 0 && (
                        <span>• {item.document_ids.length} doc{item.document_ids.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

