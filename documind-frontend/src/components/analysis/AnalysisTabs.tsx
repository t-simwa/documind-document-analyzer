import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, Layers, Share2, MessageCircleMore } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SummaryTab } from "./SummaryTab";
import { ExtractsTab } from "./ExtractsTab";
import { ShareAnalysisDialog } from "@/components/sharing/ShareAnalysisDialog";
import { CommentsPanel } from "@/components/sharing/CommentsPanel";
import type { DocumentInsights, QueryStatus } from "@/types/api";
import type { QueryConfig } from "@/types/query";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    text: string;
    page?: number;
    section?: string;
  }>;
  timestamp: Date;
  status?: QueryStatus;
  error?: string;
  canRetry?: boolean;
}

interface AnalysisTabsProps {
  messages: Message[];
  onSendMessage: (message: string, retryMessageId?: string) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
  queryStatus?: QueryStatus;
  onCancelQuery?: () => void;
  onRetryQuery?: (messageId: string) => void;
  documentId?: string;
  documentName?: string;
  onCitationClick?: (citation: { text: string; page?: number; section?: string }) => void;
  insights: DocumentInsights | null;
  insightsLoading?: boolean;
  insightsError?: string | null;
  onRetryInsights?: () => void;
  queryConfig?: QueryConfig;
  onQueryConfigChange?: (config: QueryConfig) => void;
  loadingProgress?: {
    phase: "retrieving" | "generating";
    progress: number;
    estimatedTimeRemaining?: number;
  } | null;
}

export const AnalysisTabs = ({
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  queryStatus,
  onCancelQuery,
  onRetryQuery,
  documentId,
  documentName,
  onCitationClick,
  insights,
  insightsLoading,
  insightsError,
  onRetryInsights,
  queryConfig,
  onQueryConfigChange,
  loadingProgress,
}: AnalysisTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [shareAnalysisDialogOpen, setShareAnalysisDialogOpen] = useState(false);

  const handleQuestionClick = (question: string) => {
    onSendMessage(question);
    setActiveTab("chat");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b border-border/50 bg-background px-5 flex items-center justify-between">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-none bg-transparent p-0 text-muted-foreground gap-0.5">
            <TabsTrigger 
              value="chat" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="summary" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Summary
            </TabsTrigger>
            <TabsTrigger 
              value="extracts" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Extracts
            </TabsTrigger>
            {documentId && (
              <TabsTrigger 
                value="comments" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=inactive]:hover:text-foreground/80 border-b-2 border-transparent"
              >
                <MessageCircleMore className="h-3.5 w-3.5 mr-1.5" />
                Comments
              </TabsTrigger>
            )}
          </TabsList>
          {documentId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareAnalysisDialogOpen(true)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Analysis
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="chat" className="h-full m-0 mt-0">
            <ChatInterface
              messages={messages}
              onSendMessage={onSendMessage}
              onClearHistory={onClearHistory}
              isLoading={isLoading}
              queryStatus={queryStatus}
              onCancelQuery={onCancelQuery}
              onRetryQuery={onRetryQuery}
              documentId={documentId}
              documentName={documentName}
              summary={insights?.summary}
              onCitationClick={onCitationClick}
              suggestedQuestions={insights?.suggestedQuestions || []}
              suggestedQuestionsLoading={insightsLoading}
              queryConfig={queryConfig}
              onQueryConfigChange={onQueryConfigChange}
              loadingProgress={loadingProgress}
            />
          </TabsContent>

          <TabsContent value="summary" className="h-full m-0 mt-0">
            <SummaryTab
              documentId={documentId}
              documentName={documentName}
              summary={insights?.summary || null}
              isLoading={insightsLoading}
              error={insightsError}
              onRetry={onRetryInsights}
            />
          </TabsContent>

          <TabsContent value="extracts" className="h-full m-0 mt-0">
            <ExtractsTab
              entities={insights?.entities || null}
              isLoading={insightsLoading}
              error={insightsError}
              onRetry={onRetryInsights}
            />
          </TabsContent>

          {documentId && (
            <TabsContent value="comments" className="h-full m-0 mt-0">
              <CommentsPanel
                documentId={documentId}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Share Analysis Dialog */}
      {documentId && (
        <ShareAnalysisDialog
          open={shareAnalysisDialogOpen}
          onOpenChange={setShareAnalysisDialogOpen}
          documentId={documentId}
          documentName={documentName || "Document"}
          hasChatHistory={messages.length > 0}
          hasSummary={!!insights?.summary}
        />
      )}
    </div>
  );
};

