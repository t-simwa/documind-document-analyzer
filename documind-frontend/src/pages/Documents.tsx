import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { UploadZone } from "@/components/upload/UploadZone";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SplitScreenAnalysis } from "@/components/analysis/SplitScreenAnalysis";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { EmptyState } from "@/components/empty/EmptyState";
import { DocumentListView } from "@/components/documents/DocumentListView";
import { MultiDocumentSelector } from "@/components/cross-document/MultiDocumentSelector";
import { CrossDocumentAnalysis } from "@/components/cross-document/CrossDocumentAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GitCompare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentsApi } from "@/services/api";
import type { Document } from "@/types/api";

type ViewState = "empty" | "upload" | "processing" | "chat" | "list" | "multi-select" | "cross-document";

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
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [documentUrls, setDocumentUrls] = useState<Map<string, string>>(new Map());
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedDocument = documents.find((d) => d.id === selectedDocId);

  // Check for newProject query parameter
  useEffect(() => {
    if (searchParams.get("newProject") === "true") {
      setOpenProjectDialog(true);
      // Remove the query parameter from URL
      searchParams.delete("newProject");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Check for upload query parameter
  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      setViewState("upload");
      setSelectedDocId(null);
      // Remove the query parameter from URL
      searchParams.delete("upload");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch document URL when document is selected
  useEffect(() => {
    const fetchDocumentUrl = async () => {
      if (selectedDocId) {
        try {
          const url = await documentsApi.getFileUrl(selectedDocId);
          setDocumentUrl(url);
        } catch (error) {
          console.error("Failed to get document URL:", error);
          setDocumentUrl(null);
        }
      } else {
        setDocumentUrl(null);
      }
    };
    fetchDocumentUrl();
  }, [selectedDocId]);

  const handleNewUpload = () => {
    setViewState("upload");
    setSelectedDocId(null);
  };

  const simulateProcessing = useCallback(async (docName: string, docId: string, docProjectId?: string | null) => {
    setProcessingDocName(docName);
    setViewState("processing");
    setCurrentStep(0);

    // Show processing animation (document is already ready, but we show the simulation)
    for (let i = 0; i < processingSteps.length; i++) {
      setCurrentStep(i);
      await new Promise((resolve) => setTimeout(resolve, 800)); // Slightly faster for better UX
    }

    // Document is already ready, just reload to ensure UI is updated
    try {
      // Get the document directly by ID, or reload documents for the document's project
      // This ensures we find the document regardless of the currently selected project
      let updatedDoc: Document | undefined;
      
      // First, try to get the document directly
      try {
        updatedDoc = await documentsApi.get(docId);
      } catch (e) {
        // If direct get fails, reload documents for the document's project
        const response = await documentsApi.list({ projectId: docProjectId });
        updatedDoc = response.documents.find((d) => d.id === docId);
      }
      
      // If still not found, reload all documents (no filter)
      if (!updatedDoc) {
        const response = await documentsApi.list();
        updatedDoc = response.documents.find((d) => d.id === docId);
      }
      
      if (updatedDoc && updatedDoc.status === "ready") {
        // Reload documents for the current view (selected project or all)
        const response = await documentsApi.list({ projectId: selectedProjectId });
        setDocuments(response.documents);
        
        // Set the selected document and open split viewer
        setSelectedDocId(docId);
        // Use setTimeout to ensure state updates are processed before changing view
        setTimeout(() => {
          setViewState("chat");
        }, 50);
        toast({
          title: "Document Ready",
          description: `${docName} has been processed successfully. You can now analyze it.`,
        });
      } else {
        // Reload documents for the current view
        const response = await documentsApi.list({ projectId: selectedProjectId });
        setDocuments(response.documents);
        setViewState("list");
        toast({
          title: "Document Ready",
          description: `${docName} has been processed successfully.`,
        });
      }
    } catch (error) {
      console.error("Failed to reload documents:", error);
      // Reload documents for the current view
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);
      setViewState("list");
      toast({
        title: "Document Ready",
        description: `${docName} has been processed successfully.`,
      });
    }
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

      // Reload documents for the current view
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);

      setIsLoading(false);
      // Pass the projectId that was used for upload to simulateProcessing
      simulateProcessing(file.name, newDoc.id, newDoc.projectId);
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

  const handleMultiDocumentSelect = async () => {
    // Load all ready documents for selection (not just current project)
    try {
      const response = await documentsApi.list({ status: ["ready"] });
      setDocuments(response.documents);
      setViewState("multi-select");
      setSelectedDocIds(new Set());
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents for comparison",
        variant: "destructive",
      });
    }
  };

  const handleMultiDocumentSelectionChange = (selectedIds: Set<string>) => {
    setSelectedDocIds(selectedIds);
  };

  const handleMultiDocumentConfirm = async (selectedIds: Set<string>) => {
    if (selectedIds.size < 2) {
      toast({
        title: "Selection Required",
        description: "Please select at least 2 documents for cross-document analysis",
        variant: "destructive",
      });
      return;
    }

    // Fetch selected documents and their URLs
    const selected = documents.filter((d) => selectedIds.has(d.id) && d.status === "ready");
    
    if (selected.length < 2) {
      toast({
        title: "Error",
        description: "Selected documents must be ready for analysis",
        variant: "destructive",
      });
      return;
    }

    setSelectedDocuments(selected);
    
    // Fetch URLs for all selected documents
    const urlMap = new Map<string, string>();
    for (const doc of selected) {
      try {
        const url = await documentsApi.getFileUrl(doc.id);
        if (url) {
          urlMap.set(doc.id, url);
        }
      } catch (error) {
        console.error(`Failed to get URL for document ${doc.id}:`, error);
      }
    }
    setDocumentUrls(urlMap);
    
    setViewState("cross-document");
  };

  const handleBackFromCrossDocument = () => {
    setViewState("list");
    setSelectedDocIds(new Set());
    setSelectedDocuments([]);
    setDocumentUrls(new Map());
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
        if (!selectedDocument) {
          // If no document selected, go back to list
          setViewState("list");
          return null;
        }
        return (
          <SplitScreenAnalysis
            document={selectedDocument}
            documentUrl={documentUrl || undefined}
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            isLoading={isLoading}
            onCitationClick={(citation) => {
              // Handle citation click - scroll to page in document viewer
              toast({
                title: "Citation",
                description: `Navigating to ${citation.page ? `page ${citation.page}` : citation.section || "citation"}`,
              });
            }}
          />
        );

      case "list":
        return (
          <DocumentListView
            projectId={selectedProjectId}
            onDocumentSelect={(doc) => {
              if (doc.status === "ready") {
                setSelectedDocId(doc.id);
                setViewState("chat");
              } else {
                toast({
                  title: "Document Not Ready",
                  description: "Please wait for the document to finish processing.",
                  variant: "destructive",
                });
              }
            }}
            onCompareDocuments={handleMultiDocumentSelect}
          />
        );

      case "multi-select":
        return (
          <MultiDocumentSelector
            documents={documents}
            selectedIds={selectedDocIds}
            onSelectionChange={handleMultiDocumentSelectionChange}
            minSelection={2}
            maxSelection={10}
            onConfirm={handleMultiDocumentConfirm}
            onCancel={() => setViewState("list")}
          />
        );

      case "cross-document":
        return (
          <CrossDocumentAnalysis
            documents={selectedDocuments}
            documentUrls={documentUrls}
            onBack={handleBackFromCrossDocument}
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
        openProjectDialog={openProjectDialog}
        onProjectDialogChange={setOpenProjectDialog}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalNavBar onSearch={handleGlobalSearch} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-background">
          {/* Render directly for multi-select and cross-document views */}
          {(viewState === "multi-select" || viewState === "cross-document") ? (
            renderContent()
          ) : (
            <Tabs value={viewState} onValueChange={(v) => setViewState(v as ViewState)} className="h-full flex flex-col">
              {viewState === "list" || (viewState === "chat" && selectedDocument) ? (
                <div className="border-b border-border px-6 pt-3 pb-0">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="list" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:rounded-none w-[100px] justify-center">
                      Documents
                    </TabsTrigger>
                    {selectedDocument && (
                      <TabsTrigger 
                        value="chat" 
                        disabled={selectedDocument.status !== "ready"}
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:rounded-none w-[100px] justify-center"
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
          )}
        </main>
      </div>
    </div>
  );
};

export default Documents;
