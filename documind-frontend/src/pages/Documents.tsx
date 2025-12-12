import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { UploadZone } from "@/components/upload/UploadZone";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { EmptyState } from "@/components/empty/EmptyState";
import { DocumentListView } from "@/components/documents/DocumentListView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { documentsApi } from "@/services/api";
import type { Document } from "@/types/api";

type ViewState = "empty" | "upload" | "processing" | "chat" | "list";

const processingSteps = [
  { id: "upload", label: "Secure Upload", description: "Uploading to encrypted storage", status: "pending" as const },
  { id: "extract", label: "Text Extraction", description: "Parsing document content", status: "pending" as const },
  { id: "chunk", label: "Smart Chunking", description: "Splitting into semantic sections", status: "pending" as const },
  { id: "embed", label: "Vector Embeddings", description: "Creating searchable representations", status: "pending" as const },
  { id: "index", label: "Indexing", description: "Building retrieval index", status: "pending" as const },
];

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

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewState, setViewState] = useState<ViewState>("list");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingDocName, setProcessingDocName] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  const selectedDocument = documents.find((d) => d.id === selectedDocId);

  const handleNewUpload = () => {
    setViewState("upload");
    setSelectedDocId(null);
  };

  const simulateProcessing = useCallback(async (docName: string, docId: string) => {
    setProcessingDocName(docName);
    setViewState("processing");
    setCurrentStep(0);

    for (let i = 0; i < processingSteps.length; i++) {
      setCurrentStep(i);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    // Update document status
    try {
      await documentsApi.update(docId, {});
      // Reload documents
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);
    } catch (error) {
      console.error("Failed to update document:", error);
    }

    setViewState("list");
    toast({
      title: "Document Ready",
      description: `${docName} has been processed successfully.`,
    });
  }, [selectedProjectId, toast]);

  const handleUpload = useCallback(async (files: File[], projectId?: string | null) => {
    setIsLoading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 95));
    }, 150);

    try {
      const file = files[0];
      const newDoc = await documentsApi.upload(file, projectId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reload documents
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);

      setIsLoading(false);
      simulateProcessing(file.name, newDoc.id);
    } catch (error) {
      clearInterval(progressInterval);
      setIsLoading(false);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedProjectId, simulateProcessing, toast]);

  const handleSelectDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    setSelectedDocId(id);
    if (doc?.status === "ready") {
      setViewState("chat");
    } else if (doc?.status === "processing") {
      setViewState("processing");
      setProcessingDocName(doc.name);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await documentsApi.delete(id);
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);
      if (selectedDocId === id) {
        setSelectedDocId(null);
        setViewState("list");
      }
      toast({
        title: "Document Deleted",
        description: "The document has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1800));

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Based on my analysis of "${selectedDocument?.name}", I found relevant information regarding your query.\n\nThe document addresses this topic in several sections. The main points include the core concepts and their practical applications within the context of the document.\n\nI've identified specific passages that directly relate to your question and cited them below for reference.`,
      citations: [
        { text: "Section 2.1 - Overview and Definitions", page: 5, section: "Chapter 2" },
        { text: "Section 4.3 - Implementation Guidelines", page: 12, section: "Chapter 4" },
        { text: "Appendix A - Technical Specifications", page: 28 },
      ],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsLoading(false);
  };

  const handleClearHistory = () => {
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "Conversation history has been cleared.",
    });
  };

  const handleProjectSelect = async (projectId: string | null) => {
    setSelectedProjectId(projectId);
    try {
      const response = await documentsApi.list({ projectId });
      setDocuments(response.documents);
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const renderContent = () => {
    switch (viewState) {
      case "empty":
        return <EmptyState onUpload={handleNewUpload} />;

      case "upload":
        return (
          <div className="flex items-center justify-center h-full p-6">
            <UploadZone
              onUpload={handleUpload}
              isUploading={isLoading}
              uploadProgress={uploadProgress}
            />
          </div>
        );

      case "processing":
        return (
          <div className="flex items-center justify-center h-full p-6">
            <ProcessingStatus
              steps={processingSteps.map((step, index) => ({
                ...step,
                status: index < currentStep ? "completed" : index === currentStep ? "processing" : "pending",
              }))}
              currentStep={currentStep}
              documentName={processingDocName}
            />
          </div>
        );

      case "chat":
        return (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            isLoading={isLoading}
            documentName={selectedDocument?.name}
          />
        );

      case "list":
        return (
          <DocumentListView
            projectId={selectedProjectId}
            onDocumentSelect={(doc) => {
              setSelectedDocId(doc.id);
              if (doc.status === "ready") {
                setViewState("chat");
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  const handleGlobalSearch = (query: string) => {
    toast({
      title: "Search",
      description: `Searching for "${query}" across documents and projects...`,
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDocument={handleSelectDocument}
        onNewUpload={handleNewUpload}
        onDeleteDocument={handleDeleteDocument}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleProjectSelect}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalNavBar onSearch={handleGlobalSearch} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-background">
            <Tabs value={viewState} onValueChange={(v) => setViewState(v as ViewState)} className="h-full flex flex-col">
              {viewState === "list" || (viewState === "chat" && selectedDocument) ? (
                <div className="border-b border-border px-6 pt-3 pb-0">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="list" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:rounded-none">
                      Documents
                    </TabsTrigger>
                    {selectedDocument && (
                      <TabsTrigger 
                        value="chat" 
                        disabled={selectedDocument.status !== "ready"}
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:rounded-none"
                      >
                        Chat
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
              ) : null}
              <div className="flex-1 overflow-hidden">
                <TabsContent value="list" className="h-full m-0">
                  {renderContent()}
                </TabsContent>
                <TabsContent value="chat" className="h-full m-0">
                  {renderContent()}
                </TabsContent>
                <TabsContent value="upload" className="h-full m-0">
                  {renderContent()}
                </TabsContent>
                <TabsContent value="processing" className="h-full m-0">
                  {renderContent()}
                </TabsContent>
                <TabsContent value="empty" className="h-full m-0">
                  {renderContent()}
                </TabsContent>
              </div>
            </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Documents;
