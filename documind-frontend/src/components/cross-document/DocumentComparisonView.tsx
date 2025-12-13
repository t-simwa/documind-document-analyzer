import { useState, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, FileText, Layers, AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { DocumentViewer } from "@/components/document-viewer/DocumentViewer";
import { cn } from "@/lib/utils";
import type { Document, DocumentComparison, ComparisonSimilarity, ComparisonDifference } from "@/types/api";

interface DocumentComparisonViewProps {
  documents: Document[];
  documentUrls?: Map<string, string>;
  comparison?: DocumentComparison;
  onComparisonRequest?: () => void;
  isLoading?: boolean;
}

export const DocumentComparisonView = ({
  documents,
  documentUrls = new Map(),
  comparison,
  onComparisonRequest,
  isLoading = false,
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
    <div className="flex flex-col h-full bg-background">
      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "viewer" | "comparison")} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 bg-background px-6 pt-3">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-none bg-transparent p-0 text-muted-foreground gap-0.5">
            <TabsTrigger 
              value="viewer" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Side-by-Side View
            </TabsTrigger>
            <TabsTrigger 
              value="comparison" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
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
                  <div className="flex items-center justify-center h-full bg-muted/30 border-r border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleLeftPanel}
                      className="flex flex-col items-center gap-2 h-auto py-6 px-4"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Document 1</span>
                    </Button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col border-r border-border/50">
                    <div className="flex-shrink-0 flex items-center justify-between px-4 h-11 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">
                          {selectedDocument?.name || "Document 1"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={toggleLeftPanel} className="h-7 w-7 p-0">
                        <ChevronLeft className="h-3.5 w-3.5" />
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
                  <div className="flex items-center justify-center h-full bg-muted/30 border-l border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleRightPanel}
                      className="flex flex-col items-center gap-2 h-auto py-6 px-4"
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Document 2</span>
                    </Button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex-shrink-0 flex items-center justify-between px-4 h-11 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">
                          {nextDocument?.name || "Document 2"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={toggleRightPanel} className="h-7 w-7 p-0">
                        <ChevronRight className="h-3.5 w-3.5" />
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

        <TabsContent value="comparison" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center mx-auto mb-4 border border-border/50">
                      <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Analyzing documents...</p>
                  </div>
                </div>
              ) : comparison ? (
                <>
                  {comparison.similarities.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold text-foreground">Similarities</h3>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {comparison.similarities.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {comparison.similarities.map((similarity, index) => (
                          <ComparisonCard key={index} similarity={similarity} documents={documents} />
                        ))}
                      </div>
                    </div>
                  )}

                  {comparison.differences.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold text-foreground">Differences</h3>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {comparison.differences.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {comparison.differences.map((difference, index) => (
                          <DifferenceCard key={index} difference={difference} documents={documents} />
                        ))}
                      </div>
                    </div>
                  )}

                  {comparison.similarities.length === 0 && comparison.differences.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center mx-auto mb-4 border border-border/50">
                        <Layers className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No comparison data available</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center mx-auto mb-4 border border-border/50">
                    <Layers className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Comparison analysis not available</p>
                  {onComparisonRequest && (
                    <Button onClick={onComparisonRequest} size="sm">
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
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-semibold">{similarity.aspect}</CardTitle>
          <Badge variant="outline" className="text-xs font-normal">
            Similar
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{similarity.description}</p>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Found in:</span> {docNames}
        </div>
        {similarity.examples.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-foreground">Examples:</p>
            {similarity.examples.map((example, idx) => (
              <div key={idx} className="text-xs bg-muted/30 p-2.5 rounded border border-border/50 font-mono">
                <span className="font-medium text-foreground">{example.documentName}:</span> {example.text}
                {example.page && <span className="text-muted-foreground ml-2">(p. {example.page})</span>}
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
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-semibold">{difference.aspect}</CardTitle>
          <Badge variant="outline" className="text-xs font-normal">
            Different
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{difference.description}</p>
        <div className="space-y-2 pt-2 border-t border-border/50">
          {difference.documents.map((doc, idx) => (
            <div key={idx} className="text-xs bg-muted/30 p-2.5 rounded border border-border/50 font-mono">
              <span className="font-medium text-foreground">{doc.name}:</span> {doc.value}
              {doc.page && <span className="text-muted-foreground ml-2">(p. {doc.page})</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
