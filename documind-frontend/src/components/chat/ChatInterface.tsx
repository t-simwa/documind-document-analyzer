import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download, FileText } from "lucide-react";

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
  documentName?: string;
  onCitationClick?: (citation: { text: string; page?: number; section?: string }) => void;
}

export const ChatInterface = ({
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  documentName,
  onCitationClick,
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1.5">Start analyzing</h3>
              <p className="text-xs text-muted-foreground text-center max-w-xs mb-6">
                Ask questions about your document to extract insights and information
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendMessage("What are the main points in this document?")}
                  className="text-xs h-7"
                >
                  Main points
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendMessage("Summarize this document")}
                  className="text-xs h-7"
                >
                  Summarize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendMessage("What are the key findings?")}
                  className="text-xs h-7"
                >
                  Key findings
                </Button>
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
    </div>
  );
};
