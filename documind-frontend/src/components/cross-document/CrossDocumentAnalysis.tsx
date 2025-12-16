import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  Layers, 
  BarChart3, 
  AlertCircle, 
  FileText,
  ArrowLeft,
  RefreshCw,
  Clock
} from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { DocumentComparisonView } from "./DocumentComparisonView";
import { crossDocumentApi, savedAnalysesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatResponse } from "@/utils/formatResponse";
import { categorizeError, ErrorType } from "@/utils/errorHandler";
import { 
  saveCrossDocumentHistory, 
  loadCrossDocumentHistory, 
  clearCrossDocumentHistory,
  saveCrossDocumentComparison,
  loadCrossDocumentComparison,
  saveCrossDocumentPatterns,
  loadCrossDocumentPatterns,
  saveCrossDocumentContradictions,
  loadCrossDocumentContradictions,
} from "@/utils/crossDocumentStorage";
import type { 
  Document, 
  CrossDocumentQueryResponse,
  DocumentPattern,
  DocumentContradiction,
  DocumentComparison,
  CrossDocumentCitation,
  QueryStatus
} from "@/types/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: CrossDocumentCitation[];
  timestamp: Date;
  status?: QueryStatus;
  error?: string;
  canRetry?: boolean;
}

interface CrossDocumentAnalysisProps {
  documents: Document[];
  documentUrls?: Map<string, string>;
  onBack?: () => void;
  onLoadAnalysis?: (documentIds: string[]) => void;
}

export const CrossDocumentAnalysis = ({
  documents,
  documentUrls = new Map(),
  onBack,
  onLoadAnalysis,
}: CrossDocumentAnalysisProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "comparison" | "patterns" | "contradictions">("chat");
  const [comparison, setComparison] = useState<DocumentComparison | null>(null);
  const [patterns, setPatterns] = useState<DocumentPattern[]>([]);
  const [contradictions, setContradictions] = useState<DocumentContradiction[]>([]);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [queryStatus, setQueryStatus] = useState<QueryStatus>("idle");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{
    phase: "retrieving" | "generating";
    progress: number;
    estimatedTimeRemaining?: number;
  } | null>(null);
  const [savedAnalysesDialogOpen, setSavedAnalysesDialogOpen] = useState(false);
  const { toast } = useToast();

  const documentIds = documents.map((d) => d.id);
  const documentIdsKey = documentIds.join(",");
  const hasAttemptedLoad = useRef<string>(""); // Track which document set we've attempted
  const documentNames = documents.map((d) => d.name);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const genProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load cached comparison when document set changes
  useEffect(() => {
    if (documentIds.length >= 2) {
      const cachedComparison = loadCrossDocumentComparison(documentIds);
      if (cachedComparison) {
        setComparison(cachedComparison);
        setComparisonError(null);
        hasAttemptedLoad.current = documentIdsKey; // Mark as attempted so we don't fetch
      } else {
        // No cached comparison, reset state to allow fetching
        setComparison(null);
        setComparisonError(null);
        hasAttemptedLoad.current = ""; // Reset to allow fetch
      }
    } else {
      // Not enough documents, clear comparison
      setComparison(null);
      setComparisonError(null);
      hasAttemptedLoad.current = "";
    }
  }, [documentIdsKey]);

  // Load cached data when document set changes
  useEffect(() => {
    if (documentIds.length >= 2) {
      // Load conversation history
      const storedMessages = loadCrossDocumentHistory(documentIds);
      if (storedMessages.length > 0) {
        const restoredMessages: Message[] = storedMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          citations: msg.citations?.map((c) => ({
            text: c.text,
            page: c.page,
            section: c.section,
            documentId: c.documentId,
            documentName: c.documentName,
          })),
        }));
        setMessages(restoredMessages);
      } else {
        setMessages([]);
      }

      // Load cached comparison
      const cachedComparison = loadCrossDocumentComparison(documentIds);
      if (cachedComparison) {
        setComparison(cachedComparison);
        hasAttemptedLoad.current = documentIdsKey; // Mark as attempted so we don't fetch again
      }

      // Load cached patterns
      const cachedPatterns = loadCrossDocumentPatterns(documentIds);
      if (cachedPatterns.length > 0) {
        setPatterns(cachedPatterns);
      }

      // Load cached contradictions
      const cachedContradictions = loadCrossDocumentContradictions(documentIds);
      if (cachedContradictions.length > 0) {
        setContradictions(cachedContradictions);
      }
    } else {
      setMessages([]);
      setComparison(null);
      setPatterns([]);
      setContradictions([]);
    }
  }, [documentIdsKey]);

  // Save conversation history and update metadata whenever messages change
  useEffect(() => {
    if (documentIds.length >= 2) {
      if (messages.length > 0) {
        const storableMessages = messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          citations: msg.citations?.map((c) => ({
            text: c.text,
            page: c.page,
            section: c.section,
            documentId: c.documentId,
            documentName: c.documentName,
          })),
          timestamp: msg.timestamp.toISOString(),
          status: msg.status,
          error: msg.error,
          canRetry: msg.canRetry,
        }));
        saveCrossDocumentHistory(documentIds, storableMessages);
      }

      // Update metadata after comparison (save to backend)
      (async () => {
        try {
          await savedAnalysesApi.create({
        documentIds,
        documentNames,
            hasComparison: comparison !== null,
            hasPatterns: patterns.length > 0,
            hasContradictions: contradictions.length > 0,
            hasMessages: messages.length > 0,
          });
        } catch (error) {
          console.error("Failed to save analysis metadata:", error);
          // Don't show error to user - this is background operation
        }
      })();
    }
  }, [messages, comparison, patterns, contradictions, documentIdsKey]);

  // Cleanup abort controller and intervals on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (genProgressIntervalRef.current) {
        clearInterval(genProgressIntervalRef.current);
        genProgressIntervalRef.current = null;
      }
    };
  }, [abortController]);

  const loadComparison = async (force: boolean = false) => {
    // If not forcing, check guards
    if (!force && (documents.length < 2 || isLoadingComparison || comparison || comparisonError)) {
      return;
    }
    
    // If forcing, clear previous state
    if (force) {
      setComparison(null);
      setComparisonError(null);
      hasAttemptedLoad.current = ""; // Reset attempt tracking to allow retry
    }
    
    setIsLoadingComparison(true);
    setComparisonError(null);
    try {
      const result = await crossDocumentApi.compare(documentIds);
      setComparison(result);
      setComparisonError(null); // Clear any previous errors
      hasAttemptedLoad.current = documentIdsKey; // Mark as attempted
      
      // Save to localStorage
      saveCrossDocumentComparison(documentIds, result);
    } catch (error) {
      console.error("Failed to load comparison:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load document comparison";
      setComparisonError(errorMessage);
      hasAttemptedLoad.current = documentIdsKey; // Mark as attempted even on error
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Don't retry on error - user can manually retry via button
    } finally {
      setIsLoadingComparison(false);
    }
  };

  // Manual retry function for button clicks
  const handleRetryComparison = () => {
    loadComparison(true); // Force retry
  };

  useEffect(() => {
    // Only load comparison if we have 2+ documents, haven't attempted yet, no comparison, no error, and not loading
    // If cached comparison exists, it's already set in the cache loading effect, so we won't fetch
    if (
      documents.length >= 2 && 
      hasAttemptedLoad.current !== documentIdsKey &&
      !comparison && 
      !comparisonError && 
      !isLoadingComparison
    ) {
      loadComparison();
    }
  }, [documentIdsKey, comparison, comparisonError, isLoadingComparison]); // Depend on comparison state

  const handleSendMessage = async (message: string, retryMessageId?: string) => {
    if (documents.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 documents for cross-document analysis",
        variant: "destructive",
      });
      return;
    }

    // Cancel any existing query
    if (abortController) {
      abortController.abort();
    }

    // Create new AbortController for this query
    const controller = new AbortController();
    setAbortController(controller);
    setQueryStatus("retrieving");

    // Remove retry message if retrying
    if (retryMessageId) {
      setMessages((prev) => prev.filter((msg) => msg.id !== retryMessageId));
    }

    // Add user message to UI immediately (if not retrying)
    if (!retryMessageId) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    // Create placeholder assistant message with status
    const assistantMessageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "retrieving",
    };
    setMessages((prev) => [...prev, placeholderMessage]);
    setIsLoading(true);

    // Clear any existing intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (genProgressIntervalRef.current) {
      clearInterval(genProgressIntervalRef.current);
      genProgressIntervalRef.current = null;
    }

    // Track loading progress
    setLoadingProgress({ phase: "retrieving", progress: 0, estimatedTimeRemaining: 5 });
    const retrievalStartTime = Date.now();
    const retrievalDuration = 800;
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - retrievalStartTime;
      const progress = Math.min((elapsed / retrievalDuration) * 100, 90);
      const remaining = Math.max((retrievalDuration - elapsed) / 1000, 0);
      setLoadingProgress({
        phase: "retrieving",
        progress: Math.round(progress),
        estimatedTimeRemaining: Math.round(remaining),
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, retrievalDuration));
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setQueryStatus("generating");
    setLoadingProgress({ phase: "generating", progress: 0, estimatedTimeRemaining: 10 });
    const generationStartTime = Date.now();
    genProgressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - generationStartTime;
      const estimatedDuration = 10000;
      const progress = Math.min((elapsed / estimatedDuration) * 100, 95);
      const remaining = Math.max((estimatedDuration - elapsed) / 1000, 0);
      setLoadingProgress({
        phase: "generating",
        progress: Math.round(progress),
        estimatedTimeRemaining: Math.round(remaining),
      });
    }, 200);

    try {
      const response = await crossDocumentApi.query({
        documentIds,
        query: message,
        includePatterns: true,
        includeContradictions: true,
      }, controller.signal);
      if (genProgressIntervalRef.current) {
        clearInterval(genProgressIntervalRef.current);
        genProgressIntervalRef.current = null;
      }

      // Format the response to match chat tab formatting
      let formattedAnswer = formatResponse(response.answer);
      
      if (formattedAnswer.includes('**')) {
        formattedAnswer = formattedAnswer.replace(/\*\*/g, '');
      }

      const aiMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: formattedAnswer,
        citations: response.citations,
        timestamp: new Date(response.generatedAt),
        status: "completed",
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMessageId ? aiMessage : msg))
      );
      setQueryStatus("completed");
      setLoadingProgress({ phase: "generating", progress: 100 });

      if (response.patterns) {
        const updatedPatterns = [...patterns, ...response.patterns];
        setPatterns(updatedPatterns);
        saveCrossDocumentPatterns(documentIds, updatedPatterns);
      }
      if (response.contradictions) {
        const updatedContradictions = [...contradictions, ...response.contradictions];
        setContradictions(updatedContradictions);
        saveCrossDocumentContradictions(documentIds, updatedContradictions);
      }

      // Update metadata after successful query (save to backend)
      savedAnalysesApi.create({
        documentIds,
        documentNames,
        hasComparison: comparison !== null,
        hasPatterns: patterns.length > 0 || (response.patterns && response.patterns.length > 0),
        hasContradictions: contradictions.length > 0 || (response.contradictions && response.contradictions.length > 0),
        hasMessages: messages.length > 0,
      }).catch((error) => {
        console.error("Failed to save analysis metadata:", error);
        // Don't show error to user - this is background operation
      });

      if (response.contradictions && response.contradictions.length > 0) {
        setActiveTab("contradictions");
      } else if (response.patterns && response.patterns.length > 0) {
        setActiveTab("patterns");
      }
    } catch (error) {
      // Clear all intervals on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (genProgressIntervalRef.current) {
        clearInterval(genProgressIntervalRef.current);
        genProgressIntervalRef.current = null;
      }
      console.error("Failed to query documents:", error);
      
      const categorizedError = categorizeError(error);
      
      if (categorizedError.type !== ErrorType.CANCELLED) {
        let toastTitle = "Query Failed";
        if (categorizedError.type === ErrorType.NETWORK) {
          toastTitle = "Connection Error";
        } else if (categorizedError.type === ErrorType.TIMEOUT) {
          toastTitle = "Request Timeout";
        } else if (categorizedError.type === ErrorType.API) {
          toastTitle = "Server Error";
        }

        toast({
          title: toastTitle,
          description: categorizedError.userMessage,
          variant: "destructive",
        });
      }

      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: categorizedError.type === ErrorType.CANCELLED
          ? "Query was cancelled."
          : categorizedError.userMessage,
        timestamp: new Date(),
        status: categorizedError.type === ErrorType.CANCELLED ? "cancelled" : "error",
        error: categorizedError.message,
        canRetry: categorizedError.canRetry,
      };
      
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMessageId ? errorMessage : msg))
      );
      setQueryStatus(categorizedError.type === ErrorType.CANCELLED ? "cancelled" : "error");
      setLoadingProgress(null);
    } finally {
      setIsLoading(false);
      setAbortController(null);
      setQueryStatus("idle");
      setLoadingProgress(null);
    }
  };

  const handleCancelQuery = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setQueryStatus("cancelled");
      setIsLoading(false);
      setLoadingProgress(null);
    }
  };

  const handleRetryQuery = (messageId: string) => {
    const errorIndex = messages.findIndex((msg) => msg.id === messageId);
    if (errorIndex > 0) {
      const userMessage = messages[errorIndex - 1];
      if (userMessage.role === "user") {
        handleSendMessage(userMessage.content, messageId);
      }
    }
  };

  const handleClearHistory = () => {
    if (documentIds.length > 0) {
      clearCrossDocumentHistory(documentIds);
    }
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "Conversation history has been cleared.",
    });
  };

  const handleCitationClick = (citation: CrossDocumentCitation) => {
    toast({
      title: "Citation",
      description: `From ${citation.documentName}${citation.page ? `, page ${citation.page}` : ""}`,
    });
  };

  const allPatterns = patterns;
  const allContradictions = contradictions;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center border border-border/50">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Cross-Document Analysis</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {documents.map((doc) => (
              <Badge key={doc.id} variant="secondary" className="text-xs font-normal">
                {doc.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as typeof activeTab)} 
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="border-b border-border/50 bg-background px-6 pt-3">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-none bg-transparent p-0 text-muted-foreground gap-0.5">
            <TabsTrigger 
              value="chat" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              Query
            </TabsTrigger>
            <TabsTrigger 
              value="comparison" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Comparison
              {comparison && (
                <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-xs font-normal">
                  {comparison.similarities.length + comparison.differences.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="patterns" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Patterns
              {allPatterns.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-xs font-normal">
                  {allPatterns.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="contradictions" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Contradictions
              {allContradictions.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 px-1 text-xs font-normal">
                  {allContradictions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
          <ChatInterface
            messages={messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              citations: msg.citations?.map((c) => ({
                text: c.text,
                page: c.page,
                section: c.section,
              })),
              timestamp: msg.timestamp,
              status: msg.status,
              error: msg.error,
              canRetry: msg.canRetry,
            }))}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            isLoading={isLoading}
            queryStatus={queryStatus}
            onCancelQuery={handleCancelQuery}
            onRetryQuery={handleRetryQuery}
            documentName={`${documents.length} Documents`}
            onCitationClick={handleCitationClick}
            suggestedQuestions={[
              "What are the common themes across these documents?",
              "Are there any contradictions between the documents?",
              "What patterns can be identified across all documents?",
              "How do the documents differ in their approach?",
              "What are the key similarities and differences?",
            ]}
            loadingProgress={loadingProgress}
          />
        </TabsContent>

        <TabsContent value="comparison" className="flex-1 m-0 overflow-hidden">
          <DocumentComparisonView
            documents={documents}
            documentUrls={documentUrls}
            comparison={comparison || undefined}
            onComparisonRequest={handleRetryComparison}
            isLoading={isLoadingComparison}
            error={comparisonError}
          />
        </TabsContent>

        <TabsContent value="patterns" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-4xl mx-auto">
              {allPatterns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center mb-4 border border-border/50">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-foreground mb-1">No patterns detected yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Ask questions in the Query tab to discover patterns across documents
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allPatterns.map((pattern, index) => (
                    <PatternCard key={index} pattern={pattern} documents={documents} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="contradictions" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-4xl mx-auto">
              {allContradictions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center mb-4 border border-border/50">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-foreground mb-1">No contradictions detected</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Ask questions in the Query tab to identify contradictions between documents
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allContradictions.map((contradiction, index) => (
                    <ContradictionCard key={index} contradiction={contradiction} documents={documents} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PatternCard = ({ pattern, documents }: { pattern: DocumentPattern; documents: Document[] }) => {
  const typeLabels = {
    theme: "Theme",
    entity: "Entity",
    trend: "Trend",
    relationship: "Relationship",
  };

  const docNames = pattern.documents
    .map((id) => documents.find((d) => d.id === id)?.name || id)
    .join(", ");

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-semibold">{pattern.description}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              {typeLabels[pattern.type]}
            </Badge>
            <Badge variant="secondary" className="text-xs font-normal font-mono">
              {Math.round(pattern.confidence * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{pattern.occurrences}</span>
          <span>occurrence{pattern.occurrences !== 1 ? "s" : ""}</span>
          <span>•</span>
          <span className="font-medium text-foreground">Found in:</span>
          <span>{docNames}</span>
        </div>
        {pattern.examples.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-foreground">Examples:</p>
            {pattern.examples.map((example, idx) => (
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

const ContradictionCard = ({
  contradiction,
  documents,
}: {
  contradiction: DocumentContradiction;
  documents: Document[];
}) => {
  const typeLabels = {
    factual: "Factual",
    temporal: "Temporal",
    quantitative: "Quantitative",
    categorical: "Categorical",
  };

  const severityColors = {
    low: "border-amber-200 dark:border-amber-900",
    medium: "border-orange-200 dark:border-orange-900",
    high: "border-red-200 dark:border-red-900",
  };

  return (
    <Card className={cn("border-border/50", severityColors[contradiction.severity])}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-semibold">{contradiction.description}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              {typeLabels[contradiction.type]}
            </Badge>
            <Badge
              variant={contradiction.severity === "high" ? "destructive" : "secondary"}
              className="text-xs font-normal"
            >
              {contradiction.severity.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-xs font-normal font-mono">
              {Math.round(contradiction.confidence * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 pt-2 border-t border-border/50">
          {contradiction.documents.map((doc, idx) => (
            <div key={idx} className="text-xs bg-muted/30 p-2.5 rounded border border-border/50 font-mono">
              <span className="font-medium text-foreground">{doc.name}:</span> {doc.claim}
              {doc.page && <span className="text-muted-foreground ml-2">(p. {doc.page})</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
