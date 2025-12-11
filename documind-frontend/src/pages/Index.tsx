import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { UploadZone } from "@/components/upload/UploadZone";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { EmptyState } from "@/components/empty/EmptyState";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  status: "processing" | "ready" | "error";
  uploadedAt: Date;
  size: string;
  type: string;
}

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

type ViewState = "empty" | "upload" | "processing" | "chat";

const processingSteps = [
  { id: "upload", label: "Secure Upload", description: "Uploading to encrypted storage", status: "pending" as const },
  { id: "extract", label: "Text Extraction", description: "Parsing document content", status: "pending" as const },
  { id: "chunk", label: "Smart Chunking", description: "Splitting into semantic sections", status: "pending" as const },
  { id: "embed", label: "Vector Embeddings", description: "Creating searchable representations", status: "pending" as const },
  { id: "index", label: "Indexing", description: "Building retrieval index", status: "pending" as const },
];

const getFileType = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext;
};

const Index = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewState, setViewState] = useState<ViewState>("empty");
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

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "ready" as const } : d))
    );

    setViewState("chat");
    setSelectedDocId(docId);

    toast({
      title: "Document Ready",
      description: `${docName} has been processed successfully.`,
    });
  }, [toast]);

  const handleUpload = useCallback(async (files: File[]) => {
    setIsLoading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 95));
    }, 150);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    clearInterval(progressInterval);
    setUploadProgress(100);

    const file = files[0];
    const newDoc: Document = {
      id: Date.now().toString(),
      name: file.name,
      status: "processing",
      uploadedAt: new Date(),
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: getFileType(file.name),
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setIsLoading(false);

    simulateProcessing(file.name, newDoc.id);
  }, [simulateProcessing]);

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

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDocId === id) {
      setSelectedDocId(null);
      setViewState(documents.length <= 1 ? "empty" : "upload");
    }
    toast({
      title: "Document Deleted",
      description: "The document has been removed.",
    });
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

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDocument={handleSelectDocument}
        onNewUpload={handleNewUpload}
        onDeleteDocument={handleDeleteDocument}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
