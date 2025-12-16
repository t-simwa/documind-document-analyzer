import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QueryHistory } from "./QueryHistory";
import { QueryConfigDialog } from "./QueryConfigDialog";
import { QueryStatusIndicator } from "./QueryStatusIndicator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RotateCcw, Download, Settings2, MoreVertical } from "lucide-react";
import { SuggestedQuestions } from "@/components/analysis/SuggestedQuestions";
import { ExportDialog } from "@/components/sharing/ExportDialog";
import { DEFAULT_COLLECTION_NAME } from "@/config/api";
import type { DocumentSummary } from "@/types/api";
import type { QueryConfig } from "@/types/query";
import type { QueryStatus } from "@/types/api";
import { DEFAULT_QUERY_CONFIG } from "@/types/query";

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

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, retryMessageId?: string) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
  queryStatus?: QueryStatus;
  onCancelQuery?: () => void;
  onRetryQuery?: (messageId: string) => void;
  documentId?: string;
  documentName?: string;
  summary?: DocumentSummary;
  onCitationClick?: (citation: { text: string; page?: number; section?: string }) => void;
  suggestedQuestions?: string[];
  suggestedQuestionsLoading?: boolean;
  queryConfig?: QueryConfig;
  onQueryConfigChange?: (config: QueryConfig) => void;
}

export const ChatInterface = ({
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  queryStatus = "idle",
  onCancelQuery,
  onRetryQuery,
  documentId,
  documentName,
  summary,
  onCitationClick,
  suggestedQuestions = [],
  suggestedQuestionsLoading = false,
  queryConfig = DEFAULT_QUERY_CONFIG,
  onQueryConfigChange,
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              {/* Suggested Questions */}
              {suggestedQuestions && suggestedQuestions.length > 0 && (
                <div className="w-full max-w-2xl mb-6">
                  <SuggestedQuestions
                    questions={suggestedQuestions}
                    isLoading={suggestedQuestionsLoading}
                    onQuestionClick={onSendMessage}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                <button
                  onClick={() => onSendMessage("What are the main points in this document?")}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border text-foreground/80 hover:text-foreground transition-all duration-200"
                >
                  Main points
                </button>
                <button
                  onClick={() => onSendMessage("Summarize this document")}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border text-foreground/80 hover:text-foreground transition-all duration-200"
                >
                  Summarize
                </button>
                <button
                  onClick={() => onSendMessage("What are the key findings?")}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border text-foreground/80 hover:text-foreground transition-all duration-200"
                >
                  Key findings
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    citations={message.citations}
                    timestamp={message.timestamp}
                    onCitationClick={onCitationClick}
                    status={message.status}
                    isLoading={message.status === "retrieving" || message.status === "generating"}
                  />
                  {/* Status indicator for loading/error states */}
                  {message.status && message.status !== "completed" && (
                    <div className="max-w-3xl mx-auto px-6">
                      <QueryStatusIndicator
                        status={message.status}
                        onCancel={message.status === "retrieving" || message.status === "generating" ? onCancelQuery : undefined}
                      />
                    </div>
                  )}
                  {/* Retry button for error messages */}
                  {message.status === "error" && message.canRetry && onRetryQuery && (
                    <div className="max-w-3xl mx-auto px-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetryQuery(message.id)}
                        className="h-7 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        Retry Query
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {/* Global status indicator when loading but no message yet */}
              {isLoading && queryStatus !== "idle" && messages.length > 0 && !messages[messages.length - 1]?.status && (
                <div className="max-w-3xl mx-auto px-6">
                  <QueryStatusIndicator
                    status={queryStatus}
                    onCancel={onCancelQuery}
                  />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-6 py-2.5">
          <div className="flex-1">
            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {messages.length > 0 && (
                <>
                  <DropdownMenuItem onClick={onClearHistory}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear history
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onQueryConfigChange && (
                <>
                  <DropdownMenuItem onClick={() => setConfigDialogOpen(true)}>
                    <Settings2 className="h-4 w-4 mr-2" />
                    Query Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {messages.length > 0 && (
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export conversation
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Query History */}
      <QueryHistory
        onSelectQuery={onSendMessage}
        documentId={documentId}
        collectionName={DEFAULT_COLLECTION_NAME}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        documentId={documentId}
        documentName={documentName}
        chatMessages={messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }))}
        summary={summary}
      />

      {/* Query Config Dialog */}
      {onQueryConfigChange && (
        <QueryConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          config={queryConfig}
          onConfigChange={onQueryConfigChange}
        />
      )}
    </div>
  );
};
