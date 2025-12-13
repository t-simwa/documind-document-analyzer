import { useState, useCallback, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, MessageSquare } from "lucide-react";
import { DocumentViewer } from "@/components/document-viewer/DocumentViewer";
import { AnalysisTabs } from "./AnalysisTabs";
import { cn } from "@/lib/utils";
import { insightsApi } from "@/services/api";
import type { Document, DocumentInsights } from "@/types/api";

interface Citation {
  text: string;
  page?: number;
  section?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

interface SplitScreenAnalysisProps {
  document: Document | null;
  documentUrl?: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
  onCitationClick?: (citation: Citation) => void;
}

export const SplitScreenAnalysis = ({
  document,
  documentUrl,
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  onCitationClick,
}: SplitScreenAnalysisProps) => {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [highlightedText, setHighlightedText] = useState<string>("");
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [insights, setInsights] = useState<DocumentInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setLeftPanelCollapsed(true);
        setRightPanelCollapsed(false);
      } else {
        setLeftPanelCollapsed(false);
        setRightPanelCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Extract citations from messages for highlighting
  useEffect(() => {
    const allCitations: Citation[] = [];
    messages.forEach((msg) => {
      if (msg.citations) {
        allCitations.push(...msg.citations);
      }
    });
    setActiveCitations(allCitations);
  }, [messages]);

  // Fetch insights when document is ready
  useEffect(() => {
    if (document && document.status === "ready" && document.id) {
      setInsightsLoading(true);
      setInsightsError(null);
      insightsApi
        .getInsights(document.id)
        .then((data) => {
          setInsights(data);
          setInsightsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching insights:", error);
          setInsightsError(error.message || "Failed to load insights");
          setInsightsLoading(false);
        });
    } else {
      // Reset insights when document changes or is not ready
      setInsights(null);
      setInsightsLoading(false);
      setInsightsError(null);
    }
  }, [document?.id, document?.status]);

  // Handle citation click from chat
  const handleCitationClick = useCallback(
    (citation: Citation) => {
      if (citation.page) {
        setCurrentPage(citation.page);
        setHighlightedText(citation.text);
        if (leftPanelCollapsed) {
          setLeftPanelCollapsed(false);
        }
        onCitationClick?.(citation);
      }
    },
    [leftPanelCollapsed, onCitationClick]
  );

  const toggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };

  const toggleRightPanel = () => {
    setRightPanelCollapsed(!rightPanelCollapsed);
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    if (leftPanelCollapsed && rightPanelCollapsed && !isMobile) {
      setRightPanelCollapsed(false);
    }
  }, [leftPanelCollapsed, rightPanelCollapsed, isMobile]);

  // Mobile: show only one panel at a time
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex border-b border-border bg-card/50 backdrop-blur-sm">
          <Button
            variant={leftPanelCollapsed ? "ghost" : "ghost"}
            size="sm"
            onClick={() => {
              setLeftPanelCollapsed(false);
              setRightPanelCollapsed(true);
            }}
            className={cn(
              "flex-1 rounded-none border-b-2 transition-colors",
              !leftPanelCollapsed
                ? "border-foreground text-foreground bg-transparent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Document
          </Button>
          <Button
            variant={rightPanelCollapsed ? "ghost" : "ghost"}
            size="sm"
            onClick={() => {
              setRightPanelCollapsed(false);
              setLeftPanelCollapsed(true);
            }}
            className={cn(
              "flex-1 rounded-none border-b-2 transition-colors",
              !rightPanelCollapsed
                ? "border-foreground text-foreground bg-transparent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Analysis
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {!leftPanelCollapsed && (
            <div className="h-full">
              <DocumentViewer
                document={document}
                documentUrl={documentUrl}
                citations={activeCitations}
                highlightedText={highlightedText}
                onPageChange={handlePageChange}
                onCitationClick={handleCitationClick}
              />
            </div>
          )}
          {!rightPanelCollapsed && (
            <div className="h-full">
              <AnalysisTabs
                messages={messages}
                onSendMessage={onSendMessage}
                onClearHistory={onClearHistory}
                isLoading={isLoading}
                documentId={document?.id}
                documentName={document?.name}
                onCitationClick={handleCitationClick}
                insights={insights}
                insightsLoading={insightsLoading}
                insightsError={insightsError}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop: Split-screen with resizable panels
  return (
    <div className="h-full w-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Document Viewer */}
        <ResizablePanel
          defaultSize={50}
          minSize={25}
          maxSize={75}
          collapsible={true}
          {...(leftPanelCollapsed ? { collapsed: true } : {})}
          onCollapse={() => setLeftPanelCollapsed(true)}
          onExpand={() => setLeftPanelCollapsed(false)}
          className={cn("relative", leftPanelCollapsed && "min-w-0")}
        >
          {leftPanelCollapsed ? (
            <div className="flex items-center justify-center h-full bg-muted/30 border-r border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLeftPanel}
                className="flex flex-col items-center gap-2 h-auto py-6 px-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-md bg-muted/50">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Document</span>
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col border-r border-border/50">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 h-11 border-b border-border/50 bg-card/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {document?.name || "Document"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLeftPanel}
                  className="h-7 w-7 p-0 hover:bg-muted/50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <DocumentViewer
                  document={document}
                  documentUrl={documentUrl}
                  citations={activeCitations}
                  highlightedText={highlightedText}
                  onPageChange={handlePageChange}
                  onCitationClick={handleCitationClick}
                />
              </div>
            </div>
          )}
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle withHandle className="w-1 bg-border/50 hover:bg-border transition-colors" />

        {/* Right Panel - Analysis */}
        <ResizablePanel
          defaultSize={50}
          minSize={25}
          maxSize={75}
          collapsible={true}
          {...(rightPanelCollapsed ? { collapsed: true } : {})}
          onCollapse={() => setRightPanelCollapsed(true)}
          onExpand={() => setRightPanelCollapsed(false)}
          className={cn("relative", rightPanelCollapsed && "min-w-0")}
        >
          {rightPanelCollapsed ? (
            <div className="flex items-center justify-center h-full bg-muted/30 border-l border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRightPanel}
                className="flex flex-col items-center gap-2 h-auto py-6 px-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-md bg-muted/50">
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Analysis</span>
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 h-11 border-b border-border/50 bg-card/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">Document Analysis</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleRightPanel}
                  className="h-7 w-7 p-0 hover:bg-muted/50"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AnalysisTabs
                  messages={messages}
                  onSendMessage={onSendMessage}
                  onClearHistory={onClearHistory}
                  isLoading={isLoading}
                  documentId={document?.id}
                  documentName={document?.name}
                  onCitationClick={handleCitationClick}
                  insights={insights}
                  insightsLoading={insightsLoading}
                  insightsError={insightsError}
                />
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
