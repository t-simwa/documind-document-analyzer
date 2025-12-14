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
import { documentsApi, queryApi, tasksApi } from "@/services/api";
import { getProcessingStatus } from "@/services/processingQueueService";
import { DEFAULT_COLLECTION_NAME } from "@/config/api";
import { formatResponse } from "@/utils/formatResponse";
import type { Document, ProcessingStatus as ProcessingStatusType, SecurityScanResult, QueryRequest, CitationResponse } from "@/types/api";

type ViewState = "empty" | "upload" | "processing" | "chat" | "list" | "multi-select" | "cross-document";

const processingSteps = [
  { id: "upload", label: "Secure Upload", description: "Uploading to encrypted storage", status: "pending" as const },
  { id: "security_scan", label: "Security Scan", description: "Scanning for malware and viruses", status: "pending" as const },
  { id: "extract", label: "Text Extraction", description: "Parsing document content", status: "pending" as const },
  { id: "ocr", label: "OCR Processing", description: "Extracting text from images", status: "pending" as const },
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
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);
  const [securityScanResult, setSecurityScanResult] = useState<SecurityScanResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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

  // Poll processing status when in processing view
  useEffect(() => {
    if (viewState === "processing" && selectedDocId) {
      let pollInterval: NodeJS.Timeout;
      let simulationTimeout: NodeJS.Timeout | null = null;
      let pollCount = 0;
      const maxPolls = 300; // 5 minutes max (1 second intervals)
      let backendCompleted = false;
      let simulationStarted = false;

      // Simulate step-by-step progression even if backend is done
      const runSimulation = async (initialStatus: ProcessingStatusType) => {
        if (simulationStarted) return;
        simulationStarted = true;
        
        // Stop polling once simulation starts to avoid 404 errors
        if (pollInterval) {
          clearInterval(pollInterval);
        }

        const allSteps = processingSteps;
        let currentSimStep = 0;

        // Find the first incomplete step
        const completedCount = initialStatus.steps.filter(s => s.status === "completed").length;
        currentSimStep = completedCount;

        // If backend is already done, start from beginning for visual effect
        if (initialStatus.progress === 100) {
          currentSimStep = 0;
          // Reset all steps to pending for simulation
          const resetSteps = allSteps.map((step, idx) => {
            const existingStep = initialStatus.steps.find(s => s.id === step.id);
            return {
              id: step.id,
              label: step.label,
              status: idx === 0 ? "in_progress" : "pending" as const,
              startedAt: idx === 0 ? new Date() : undefined,
            };
          });
          setProcessingStatus({
            ...initialStatus,
            steps: resetSteps,
            progress: 0,
            currentStep: allSteps[0].id,
          });
          setCurrentStep(0);
        }

        // Animate through each step
        const animateStep = async (stepIndex: number) => {
          if (stepIndex >= allSteps.length) {
            // All steps completed, wait a moment then redirect
            setTimeout(() => {
              clearInterval(pollInterval);
              if (simulationTimeout) clearTimeout(simulationTimeout);
              
              documentsApi.list({ projectId: selectedProjectId }).then((response) => {
                setDocuments(response.documents);
                
                const updatedDoc = response.documents.find(d => d.id === selectedDocId);
                if (updatedDoc?.status === "ready") {
                  setViewState("chat");
                  toast({
                    title: "Document Ready",
                    description: "Document has been processed and indexed. You can now query it.",
                  });
                }
              });
            }, 1500);
            return;
          }

          const step = allSteps[stepIndex];
          const stepDuration = stepIndex === 0 ? 800 : stepIndex === 1 ? 600 : 1200; // Vary step durations

          // Update current step to processing
          setProcessingStatus(prev => {
            if (!prev) return prev;
            const updatedSteps = prev.steps.map(s => {
              if (s.id === step.id) {
                return { ...s, status: "in_progress" as const, startedAt: new Date() };
              }
              return s;
            });
            setCurrentStep(stepIndex);
            return {
              ...prev,
              steps: updatedSteps,
              currentStep: step.id,
              progress: Math.round(((stepIndex + 1) / allSteps.length) * 100),
            };
          });

          // Wait for step duration
          await new Promise(resolve => setTimeout(resolve, stepDuration));

          // Mark step as completed
          setProcessingStatus(prev => {
            if (!prev) return prev;
            const updatedSteps = prev.steps.map(s => {
              if (s.id === step.id) {
                return { ...s, status: "completed" as const, completedAt: new Date() };
              }
              return s;
            });
            return {
              ...prev,
              steps: updatedSteps,
              progress: Math.round(((stepIndex + 1) / allSteps.length) * 100),
            };
          });

          // Move to next step
          animateStep(stepIndex + 1);
        };

        // Start animation from current step
        animateStep(currentSimStep);
      };

      const pollStatus = async () => {
        try {
          const status = await getProcessingStatus(selectedDocId);
          
          if (status) {
            // If backend completed but simulation hasn't started, start it
            if (status.progress === 100 && !backendCompleted) {
              backendCompleted = true;
              if (!simulationStarted) {
                runSimulation(status);
              }
            } else if (status.progress < 100) {
              // Backend still processing, update status normally
              setProcessingStatus(status);
              
              const stepIndex = processingSteps.findIndex(
                step => step.id === status.currentStep
              );
              if (stepIndex >= 0) {
                setCurrentStep(stepIndex);
              }
            }

            // Check if processing failed
            if (status.error) {
              clearInterval(pollInterval);
              if (simulationTimeout) clearTimeout(simulationTimeout);
              toast({
                title: "Processing Error",
                description: status.error.message,
                variant: "destructive",
              });
            }
          } else {
            // Status is null, check document directly
            try {
              const doc = await documentsApi.get(selectedDocId);
              if (doc.status === "ready" && !backendCompleted) {
                backendCompleted = true;
                // Create completed status for simulation
                const completedStatus: ProcessingStatusType = {
                  currentStep: "",
                  progress: 100,
                  steps: processingSteps.map(step => ({
                    id: step.id,
                    label: step.label,
                    status: "completed" as const,
                    completedAt: new Date(),
                  })),
                  queuePosition: 0,
                };
                if (!simulationStarted) {
                  runSimulation(completedStatus);
                }
              } else if (doc.status === "error") {
                clearInterval(pollInterval);
                if (simulationTimeout) clearTimeout(simulationTimeout);
                toast({
                  title: "Processing Error",
                  description: "Document processing failed.",
                  variant: "destructive",
                });
                return;
              }
            } catch (error) {
              console.error("Failed to check document status:", error);
            }
          }

          pollCount++;
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            if (simulationTimeout) clearTimeout(simulationTimeout);
            toast({
              title: "Processing Timeout",
              description: "Processing is taking longer than expected. Please check back later.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Failed to poll processing status:", error);
        }
      };

      // Poll immediately, then every 1 second
      pollStatus();
      pollInterval = setInterval(pollStatus, 1000);

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        if (simulationTimeout) {
          clearTimeout(simulationTimeout);
        }
      };
    }
  }, [viewState, selectedDocId, selectedProjectId, toast]);

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

  const processDocumentWithSecurity = useCallback(async (
    docName: string,
    docId: string,
    file: File,
    docProjectId?: string | null
  ) => {
    // When using real backend upload, processing is triggered automatically
    // We just need to set up the UI state and start polling for status
    setProcessingDocName(docName);
    setViewState("processing");
    setCurrentStep(0);
    setSecurityScanResult(null);
    setProcessingStatus(null);
    setSelectedDocId(docId);

    // The backend will handle security scan and processing automatically
    // The polling useEffect will handle status updates
    // Just reload documents to get the latest status
    try {
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);
    } catch (error) {
      console.error("Failed to reload documents:", error);
    }
  }, [selectedProjectId]);

  const handleRetryProcessing = useCallback(async () => {
    if (!uploadedFile || !selectedDocId) return;

    const doc = documents.find((d) => d.id === selectedDocId);
    if (!doc) return;

    try {
      const fileType = uploadedFile.type || "";
      const processingStatus = await documentsApi.retryProcessing(
        selectedDocId,
        doc.name,
        fileType,
        (status) => {
          setProcessingStatus(status);
          const stepIndex = processingSteps.findIndex(step => step.id === status.currentStep);
          if (stepIndex >= 0) {
            setCurrentStep(stepIndex);
          }
        }
      );

      setProcessingStatus(processingStatus);

      // Reload documents
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);

      if (processingStatus.progress === 100 && !processingStatus.error) {
        const updatedDoc = response.documents.find((d) => d.id === selectedDocId);
        if (updatedDoc && updatedDoc.status === "ready") {
          setSelectedDocId(selectedDocId);
          setTimeout(() => {
            setViewState("chat");
          }, 50);
          toast({
            title: "Processing Complete",
            description: "Document has been processed successfully.",
          });
        }
      }
    } catch (error) {
      console.error("Retry error:", error);
      toast({
        title: "Retry Failed",
        description: "Failed to retry processing. Please try again.",
        variant: "destructive",
      });
    }
  }, [uploadedFile, selectedDocId, documents, selectedProjectId, toast]);

  const handleUpload = useCallback(async (files: File[], projectId?: string | null) => {
    setIsLoading(true);
    setUploadProgress(0);
    const file = files[0];
    setUploadedFile(file);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 95));
    }, 150);

    try {
      // Upload file to backend
      const newDoc = await documentsApi.upload(file, projectId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Immediately switch to processing view BEFORE reloading documents
      // This ensures the processing simulation page is shown
      setProcessingDocName(file.name);
      setViewState("processing");
      setCurrentStep(0);
      setSecurityScanResult(null);
      setProcessingStatus(null);
      setSelectedDocId(newDoc.id);

      // Reload documents for the current view
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);

      setIsLoading(false);
      
      // The polling useEffect will handle status updates automatically
      // No need to call processDocumentWithSecurity since we've already set up the state
    } catch (error) {
      clearInterval(progressInterval);
      setIsLoading(false);
      setViewState("upload"); // Return to upload view on error
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedProjectId, toast]);

  const handleSelectDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    setSelectedDocId(id);
    if (doc?.status === "ready") {
      setViewState("chat");
    } else if (doc?.status === "processing") {
      setViewState("processing");
      setProcessingDocName(doc.name);
      setSecurityScanResult(doc.securityScan || null);
      setProcessingStatus(doc.processingStatus || null);
      // Set current step based on processing status
      if (doc.processingStatus) {
        const stepIndex = processingSteps.findIndex(step => step.id === doc.processingStatus?.currentStep);
        if (stepIndex >= 0) {
          setCurrentStep(stepIndex);
        }
      }
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
    if (!selectedDocument) return;

    // Check if document is ready (indexed)
    if (selectedDocument.status !== "ready") {
      toast({
        title: "Document Not Ready",
        description: "The document is still being processed. Please wait for indexing to complete.",
        variant: "destructive",
      });
      return;
    }

    // Verify document is actually indexed by checking task status
    const taskId = `doc_process_${selectedDocument.id}`;
    try {
      const task = await tasksApi.getTaskStatus(taskId);
      if (task && (task.status !== "completed" || task.result?.status !== "processed")) {
        toast({
          title: "Document Not Indexed",
          description: "The document indexing is not complete. Please wait and try again.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Failed to verify document status:", error);
      // Continue anyway - backend will handle if not indexed
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages)
      const conversationHistory = messages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Prepare query request
      const queryRequest: QueryRequest = {
        query: message,
        collection_name: DEFAULT_COLLECTION_NAME,
        document_ids: [selectedDocument.id], // Limit to current document
        conversation_history: conversationHistory,
        generate_insights: false, // Can be toggled via UI
        search_type: "hybrid", // Default to hybrid search
        top_k: 5, // Retrieve top 5 chunks
      };

      // Call query API
      const response = await queryApi.query(queryRequest);

      // Map backend citations to frontend format
      const citations = response.citations.map((c: CitationResponse) => ({
        text: c.metadata?.text || `Chunk ${c.chunk_id}`,
        page: c.page,
        section: c.metadata?.section,
        document_id: c.document_id,
        chunk_id: c.chunk_id,
        score: c.score,
      }));

      // Format the response to remove markdown symbols and improve readability
      // Ensure response is fully formatted before displaying
      let formattedAnswer = formatResponse ? formatResponse(response.answer) : response.answer;
      
      // Final safety check: remove any remaining ** symbols
      if (formattedAnswer.includes('**')) {
        formattedAnswer = formattedAnswer.replace(/\*\*/g, '');
      }

      // Add assistant response to messages
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: formattedAnswer,
        citations: citations,
        timestamp: new Date(response.generated_at),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Query failed:", error);
      const errorMessageText = error instanceof Error ? error.message : "Failed to get answer. Please try again.";
      
      // Log detailed error for debugging
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      
      toast({
        title: "Query Failed",
        description: errorMessageText,
        variant: "destructive",
      });

      // Optionally add error message to chat
      const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
        content: "Sorry, I encountered an error while processing your query. Please try again.",
      timestamp: new Date(),
    };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
    setIsLoading(false);
    }
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
        // Map processing status steps to display steps
        const displaySteps = processingSteps.map((step, index) => {
          const stepStatus = processingStatus?.steps.find(s => s.id === step.id);
          let status: "pending" | "processing" | "completed" | "error" = "pending";
          
          if (stepStatus) {
            status = stepStatus.status;
          } else if (index < currentStep) {
            status = "completed";
          } else if (index === currentStep) {
            status = "processing";
          }

          return {
            ...step,
            status,
          };
        });

        return (
          <div className="flex items-center justify-center h-full p-4 overflow-y-auto">
            <ProcessingStatus
              steps={displaySteps}
              currentStep={currentStep}
              documentName={processingDocName}
              securityScan={securityScanResult || undefined}
              ocrStatus={processingStatus?.ocrStatus}
              processingError={processingStatus?.error}
              onRetry={handleRetryProcessing}
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
