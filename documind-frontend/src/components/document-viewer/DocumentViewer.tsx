import { useState, useCallback, useRef, useEffect } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Document as DocumentType } from "@/types/api";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

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
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Use provided document URL directly
  const docUrl = documentUrl || null;

  // Configure default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnail tab
    ],
  });

  // Handle citation highlighting
  useEffect(() => {
    if (citations.length > 0 && pageNumber) {
      const relevantCitations = citations.filter((c) => c.page === pageNumber);
      if (relevantCitations.length > 0 && onCitationClick) {
        // Citation highlighting would be implemented here
      }
    }
  }, [citations, pageNumber, onCitationClick]);

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
              Download Document
            </Button>
          </div>
        </div>
      )}

      {!error && docUrl && document && (document.type === "pdf" || document.name.toLowerCase().endsWith(".pdf")) ? (
        <div className="h-full w-full">
          <Worker workerUrl={`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`}>
            <Viewer
              fileUrl={docUrl}
              plugins={[defaultLayoutPluginInstance]}
              defaultScale={0.7}
              onDocumentLoad={(e) => {
                setError(null);
                if (onPageChange) {
                  onPageChange(1);
                }
              }}
              onLoadError={(error) => {
                setError(`Failed to load document: ${error.message || "Unknown error"}`);
              }}
            />
          </Worker>
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
              Download Document
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
