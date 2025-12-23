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
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 flex items-center justify-between">
          <TabsList className="inline-flex h-8 items-center justify-start rounded-none bg-transparent p-0 text-[#737373] dark:text-[#a3a3a3] gap-0.5">
            <TabsTrigger 
              value="chat" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa] data-[state=active]:border-b-2 data-[state=active]:border-[#171717] dark:data-[state=active]:border-[#fafafa] data-[state=inactive]:hover:text-[#171717] dark:data-[state=inactive]:hover:text-[#fafafa] border-b-2 border-transparent"
            >
              <MessageSquare className="h-3 w-3 mr-1.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="summary" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa] data-[state=active]:border-b-2 data-[state=active]:border-[#171717] dark:data-[state=active]:border-[#fafafa] data-[state=inactive]:hover:text-[#171717] dark:data-[state=inactive]:hover:text-[#fafafa] border-b-2 border-transparent"
            >
              <FileText className="h-3 w-3 mr-1.5" />
              Summary
            </TabsTrigger>
            <TabsTrigger 
              value="extracts" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa] data-[state=active]:border-b-2 data-[state=active]:border-[#171717] dark:data-[state=active]:border-[#fafafa] data-[state=inactive]:hover:text-[#171717] dark:data-[state=inactive]:hover:text-[#fafafa] border-b-2 border-transparent"
            >
              <Layers className="h-3 w-3 mr-1.5" />
              Extracts
            </TabsTrigger>
            {documentId && (
              <TabsTrigger 
                value="comments" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa] data-[state=active]:border-b-2 data-[state=active]:border-[#171717] dark:data-[state=active]:border-[#fafafa] data-[state=inactive]:hover:text-[#171717] dark:data-[state=inactive]:hover:text-[#fafafa] border-b-2 border-transparent"
              >
                <MessageCircleMore className="h-3 w-3 mr-1.5" />
                Comments
              </TabsTrigger>
            )}
          </TabsList>
          {documentId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareAnalysisDialogOpen(true)}
              className="gap-1.5 h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
            >
              <Share2 className="h-3 w-3" />
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

