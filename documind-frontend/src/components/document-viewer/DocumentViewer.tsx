import { useState, useEffect, useRef } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Document as DocumentType } from "@/types/api";

interface Citation {
  text: string;
  page?: number;
  section?: string;
}

interface DocumentViewerProps {
  document: DocumentType | null;
  documentUrl?: string;
  citations?: Citation[];
  highlightedText?: string;
  onPageChange?: (page: number) => void;
  onCitationClick?: (citation: Citation) => void;
}

export const DocumentViewer = ({
  document,
  documentUrl,
  citations = [],
  highlightedText,
  onPageChange,
  onCitationClick,
}: DocumentViewerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use provided document URL directly
  const docUrl = documentUrl || null;

  // Handle document URL changes
  useEffect(() => {
    if (docUrl && document) {
      console.log("DocumentViewer: Loading PDF from URL:", docUrl, "for document:", document.name);
      setLoading(true);
      setError(null);
      
      // Set a timeout to clear loading state
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        console.log("PDF loading timeout - clearing loading state");
        setLoading(false);
      }, 3000);
    } else {
      setLoading(false);
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [docUrl, document]);

  // Handle citation highlighting
  useEffect(() => {
    if (citations.length > 0 && onCitationClick) {
      // Citation highlighting would be implemented here if needed
    }
  }, [citations, onCitationClick]);

  if (!docUrl || !document) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <div className="text-center max-w-sm px-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted/50 mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">No document selected</h3>
          <p className="text-xs text-muted-foreground">
            Select a document from your library to view it here
          </p>
        </div>
      </div>
    );
  }

  const isPdf = document.type === "pdf" || document.name.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex flex-col h-full bg-background">
      {error && (
        <div className="flex items-center justify-center h-full bg-muted/20">
          <div className="text-center max-w-md px-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10 mb-4">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">Unable to load document</h3>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(docUrl, "_blank");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </Button>
          </div>
        </div>
      )}

      {!error && docUrl && isPdf ? (
        <div className="h-full w-full relative" style={{ minHeight: "100%" }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <div className="text-center">
                <div className="h-8 w-8 border-2 border-muted border-t-foreground rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}
          <iframe
            src={docUrl}
            className="w-full h-full border-0"
            title={document.name}
            style={{ 
              minHeight: "100%", 
              width: "100%", 
              height: "100%", 
              display: "block",
              border: "none"
            }}
            allow="fullscreen"
            onLoad={() => {
              console.log("PDF iframe loaded successfully");
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
              setLoading(false);
              setError(null);
              if (onPageChange) {
                onPageChange(1);
              }
            }}
            onError={(e) => {
              console.error("PDF iframe error:", e);
              setLoading(false);
              setError("Failed to load PDF. Please try opening it in a new tab.");
            }}
          />
        </div>
      ) : !error && docUrl ? (
        <div className="flex items-center justify-center h-full bg-muted/20">
          <div className="text-center max-w-md px-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted/50 mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">Preview not available</h3>
            <p className="text-xs text-muted-foreground mb-4">
              PDF preview is currently supported. Other file types will be supported soon.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(docUrl, "_blank");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
