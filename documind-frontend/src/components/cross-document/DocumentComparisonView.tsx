import { useState, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, FileText, Layers, AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { DocumentViewer } from "@/components/document-viewer/DocumentViewer";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { cn } from "@/lib/utils";
import type { Document, DocumentComparison, ComparisonSimilarity, ComparisonDifference } from "@/types/api";

interface DocumentComparisonViewProps {
  documents: Document[];
  documentUrls?: Map<string, string>;
  comparison?: DocumentComparison;
  onComparisonRequest?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const DocumentComparisonView = ({
  documents,
  documentUrls = new Map(),
  comparison,
  onComparisonRequest,
  isLoading = false,
  error = null,
}: DocumentComparisonViewProps) => {
  const [selectedTab, setSelectedTab] = useState<"viewer" | "comparison">("viewer");
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  useEffect(() => {
    if (!comparison && documents.length >= 2 && onComparisonRequest) {
      onComparisonRequest();
    }
  }, [documents, comparison, onComparisonRequest]);

  const selectedDocument = documents[selectedDocIndex];
  const nextDocument = documents.length > 1 ? documents[(selectedDocIndex + 1) % documents.length] : null;

  const toggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };

  const toggleRightPanel = () => {
    setRightPanelCollapsed(!rightPanelCollapsed);
  };

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center mx-auto mb-4 border border-border/50">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No documents selected for comparison</p>
        </div>
      </div>
    );
  }

  if (documents.length === 1) {
    return (
      <div className="h-full">
        <DocumentViewer
          document={selectedDocument}
          documentUrl={documentUrls.get(selectedDocument.id)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "viewer" | "comparison")} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 pt-2">
          <TabsList className="inline-flex h-8 items-center justify-start rounded-none bg-transparent p-0 text-[#737373] dark:text-[#a3a3a3] gap-0.5">
            <TabsTrigger 
              value="viewer" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa] data-[state=active]:border-b-2 data-[state=active]:border-[#171717] dark:data-[state=active]:border-[#fafafa] data-[state=inactive]:hover:text-[#171717] dark:data-[state=inactive]:hover:text-[#fafafa] border-b-2 border-transparent"
            >
              <FileText className="h-3 w-3 mr-1" />
              Side-by-Side View
            </TabsTrigger>
            <TabsTrigger 
              value="comparison" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa] data-[state=active]:border-b-2 data-[state=active]:border-[#171717] dark:data-[state=active]:border-[#fafafa] data-[state=inactive]:hover:text-[#171717] dark:data-[state=inactive]:hover:text-[#fafafa] border-b-2 border-transparent"
            >
              <Layers className="h-3 w-3 mr-1" />
              Comparison Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="viewer" className="flex-1 m-0 overflow-hidden">
          <div className="h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full">
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
                  <div className="flex items-center justify-center h-full bg-[#fafafa] dark:bg-[#0a0a0a] border-r border-[#e5e5e5] dark:border-[#262626]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleLeftPanel}
                      className="flex flex-col items-center gap-1.5 h-auto py-4 px-3 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-white dark:hover:bg-[#171717]"
                    >
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-[10px] font-medium">Document 1</span>
                    </Button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col border-r border-[#e5e5e5] dark:border-[#262626]">
                    <div className="flex-shrink-0 flex items-center justify-between px-3 h-9 border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3] flex-shrink-0" />
                        <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa] truncate">
                          {selectedDocument?.name || "Document 1"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={toggleLeftPanel} className="h-6 w-6 p-0 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                      {selectedDocument && (
                        <div className="h-full">
                          <DocumentViewer
                            document={selectedDocument}
                            documentUrl={documentUrls.get(selectedDocument.id)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ResizablePanel>

              <ResizableHandle withHandle className="w-1 bg-border/50 hover:bg-border" />

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
                  <div className="flex items-center justify-center h-full bg-[#fafafa] dark:bg-[#0a0a0a] border-l border-[#e5e5e5] dark:border-[#262626]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleRightPanel}
                      className="flex flex-col items-center gap-1.5 h-auto py-4 px-3 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-white dark:hover:bg-[#171717]"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="text-[10px] font-medium">Document 2</span>
                    </Button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex-shrink-0 flex items-center justify-between px-3 h-9 border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3] flex-shrink-0" />
                        <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa] truncate">
                          {nextDocument?.name || "Document 2"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={toggleRightPanel} className="h-6 w-6 p-0 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                      {nextDocument && (
                        <div className="h-full">
                          <DocumentViewer
                            document={nextDocument}
                            documentUrl={documentUrls.get(nextDocument.id)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="flex-1 m-0 overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a]">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 max-w-4xl mx-auto">
              {isLoading ? (
                <div className="space-y-3">
                  <StatusIndicator
                    status="loading"
                    message="Analyzing documents..."
                    className="mb-3"
                  />
                  <div className="flex items-center justify-center py-6">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#171717] flex items-center justify-center mx-auto mb-3 border border-[#e5e5e5] dark:border-[#262626]">
                        <RefreshCw className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3] animate-spin" />
                      </div>
                      <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Analyzing documents...</p>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="space-y-3">
                  <StatusIndicator
                    status="error"
                    message="Unable to load comparison"
                    onRetry={onComparisonRequest}
                    className="mb-3"
                  />
                  <div className="text-center py-6">
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-3">{error}</p>
                    {onComparisonRequest && (
                      <Button onClick={onComparisonRequest} size="sm" className="h-7 text-xs border-[#e5e5e5] dark:border-[#262626]">
                        <RefreshCw className="h-3 w-3 mr-1.5" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ) : comparison ? (
                <>
                  {comparison.similarities.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <BarChart3 className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Similarities</h3>
                        <Badge variant="secondary" className="text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                          {comparison.similarities.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {comparison.similarities.map((similarity, index) => (
                          <ComparisonCard key={index} similarity={similarity} documents={documents} />
                        ))}
                      </div>
                    </div>
                  )}

                  {comparison.differences.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <AlertCircle className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Differences</h3>
                        <Badge variant="secondary" className="text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                          {comparison.differences.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {comparison.differences.map((difference, index) => (
                          <DifferenceCard key={index} difference={difference} documents={documents} />
                        ))}
                      </div>
                    </div>
                  )}

                  {comparison.similarities.length === 0 && comparison.differences.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#171717] flex items-center justify-center mx-auto mb-3 border border-[#e5e5e5] dark:border-[#262626]">
                        <Layers className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
                      </div>
                      <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">No comparison data available</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#171717] flex items-center justify-center mx-auto mb-3 border border-[#e5e5e5] dark:border-[#262626]">
                    <Layers className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
                  </div>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-3">Comparison analysis not available</p>
                  {onComparisonRequest && (
                    <Button onClick={onComparisonRequest} size="sm" className="h-7 text-xs bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]">
                      Generate Comparison
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ComparisonCard = ({
  similarity,
  documents,
}: {
  similarity: ComparisonSimilarity;
  documents: Document[];
}) => {
  const docNames = similarity.documents
    .map((id) => documents.find((d) => d.id === id)?.name || id)
    .join(", ");

  return (
    <Card className="border-[#e5e5e5] dark:border-[#262626]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs font-medium">{similarity.aspect}</CardTitle>
          <Badge variant="outline" className="text-[10px] font-normal border-[#e5e5e5] dark:border-[#262626]">
            Similar
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">{similarity.description}</p>
        <div className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
          <span className="font-medium text-[#171717] dark:text-[#fafafa]">Found in:</span> {docNames}
        </div>
        {similarity.examples.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
            <p className="text-[10px] font-medium text-[#171717] dark:text-[#fafafa]">Examples:</p>
            {similarity.examples.map((example, idx) => (
              <div key={idx} className="text-[10px] bg-[#fafafa] dark:bg-[#0a0a0a] p-2 rounded border border-[#e5e5e5] dark:border-[#262626] font-mono">
                <span className="font-medium text-[#171717] dark:text-[#fafafa]">{example.documentName}:</span> {example.text}
                {example.page && <span className="text-[#737373] dark:text-[#a3a3a3] ml-1.5">(p. {example.page})</span>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DifferenceCard = ({
  difference,
  documents,
}: {
  difference: ComparisonDifference;
  documents: Document[];
}) => {
  return (
    <Card className="border-[#e5e5e5] dark:border-[#262626]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs font-medium">{difference.aspect}</CardTitle>
          <Badge variant="outline" className="text-[10px] font-normal border-[#e5e5e5] dark:border-[#262626]">
            Different
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">{difference.description}</p>
        <div className="space-y-1.5 pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
          {difference.documents.map((doc, idx) => (
            <div key={idx} className="text-[10px] bg-[#fafafa] dark:bg-[#0a0a0a] p-2 rounded border border-[#e5e5e5] dark:border-[#262626] font-mono">
              <span className="font-medium text-[#171717] dark:text-[#fafafa]">{doc.name}:</span> {doc.value}
              {doc.page && <span className="text-[#737373] dark:text-[#a3a3a3] ml-1.5">(p. {doc.page})</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
