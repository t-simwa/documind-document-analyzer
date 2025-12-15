import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QueryHistory } from "./QueryHistory";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download, FileSearch } from "lucide-react";
import { SuggestedQuestions } from "@/components/analysis/SuggestedQuestions";
import { ExportDialog } from "@/components/sharing/ExportDialog";
import { DEFAULT_COLLECTION_NAME } from "@/config/api";
import type { DocumentSummary } from "@/types/api";

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
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
  documentId?: string;
  documentName?: string;
  summary?: DocumentSummary;
  onCitationClick?: (citation: { text: string; page?: number; section?: string }) => void;
  suggestedQuestions?: string[];
  suggestedQuestionsLoading?: boolean;
}

export const ChatInterface = ({
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  documentId,
  documentName,
  summary,
  onCitationClick,
  suggestedQuestions = [],
  suggestedQuestionsLoading = false,
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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
              <div className="w-14 h-14 rounded-xl bg-muted/40 flex items-center justify-center mb-5 border border-border/50">
                <FileSearch className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1 mb-6">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">Start your analysis</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Ask questions about your document to extract insights and information
                </p>
              </div>
              
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
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  citations={message.citations}
                  timestamp={message.timestamp}
                  onCitationClick={onCitationClick}
                />
              ))}

              {isLoading && (
                <ChatMessage role="assistant" content="" isLoading={true} />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-6 py-2.5 border-t border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Clear history
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="h-3 w-3 mr-1.5" />
            Export conversation
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
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
    </div>
  );
};
