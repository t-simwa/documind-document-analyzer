import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, Layers } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SummaryTab } from "./SummaryTab";
import { ExtractsTab } from "./ExtractsTab";
import type { DocumentInsights } from "@/types/api";

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

interface AnalysisTabsProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
  documentName?: string;
  onCitationClick?: (citation: { text: string; page?: number; section?: string }) => void;
  insights: DocumentInsights | null;
  insightsLoading?: boolean;
  insightsError?: string | null;
}

export const AnalysisTabs = ({
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  documentName,
  onCitationClick,
  insights,
  insightsLoading,
  insightsError,
}: AnalysisTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>("chat");

  const handleQuestionClick = (question: string) => {
    onSendMessage(question);
    setActiveTab("chat");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b border-border/50 bg-background px-5">
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
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="chat" className="h-full m-0 mt-0">
            <ChatInterface
              messages={messages}
              onSendMessage={onSendMessage}
              onClearHistory={onClearHistory}
              isLoading={isLoading}
              documentName={documentName}
              onCitationClick={onCitationClick}
              suggestedQuestions={insights?.suggestedQuestions || []}
              suggestedQuestionsLoading={insightsLoading}
            />
          </TabsContent>

          <TabsContent value="summary" className="h-full m-0 mt-0">
            <SummaryTab
              summary={insights?.summary || null}
              isLoading={insightsLoading}
              error={insightsError}
            />
          </TabsContent>

          <TabsContent value="extracts" className="h-full m-0 mt-0">
            <ExtractsTab
              entities={insights?.entities || null}
              isLoading={insightsLoading}
              error={insightsError}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

