import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { UploadZone } from "@/components/upload/UploadZone";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SplitScreenAnalysis } from "@/components/analysis/SplitScreenAnalysis";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { EmptyState } from "@/components/empty/EmptyState";
import { DocumentListView } from "@/components/documents/DocumentListView";
import { ProjectView } from "@/components/projects/ProjectView";
import { MultiDocumentSelector } from "@/components/cross-document/MultiDocumentSelector";
import { CrossDocumentAnalysis } from "@/components/cross-document/CrossDocumentAnalysis";
import { SavedAnalysesDialog } from "@/components/cross-document/SavedAnalysesDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GitCompare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentsApi, queryApi, tasksApi, projectsApi } from "@/services/api";
import { getProcessingStatus } from "@/services/processingQueueService";
import { getCachedQuery, cacheQuery } from "@/services/queryCache";
import { DEFAULT_COLLECTION_NAME } from "@/config/api";
import { formatResponse } from "@/utils/formatResponse";
import { categorizeError, ErrorType } from "@/utils/errorHandler";
import { saveConversationHistory, loadConversationHistory, clearConversationHistory } from "@/utils/conversationStorage";
import type { Document, ProcessingStatus as ProcessingStatusType, SecurityScanResult, QueryRequest, CitationResponse } from "@/types/api";
import type { QueryConfig } from "@/types/query";
import { DEFAULT_QUERY_CONFIG } from "@/types/query";

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

import type { QueryStatus } from "@/types/api";

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

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
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
  const [savedAnalysesDialogOpen, setSavedAnalysesDialogOpen] = useState(false);
  const [documentListRefreshTrigger, setDocumentListRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Query cancellation
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [queryStatus, setQueryStatus] = useState<QueryStatus>("idle");
  
  // Enhanced loading states
  const [loadingProgress, setLoadingProgress] = useState<{
    phase: "retrieving" | "generating";
    progress: number; // 0-100
    estimatedTimeRemaining?: number; // seconds
  } | null>(null);
  
  // Refs for interval cleanup
  const retrievalProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Query configuration state (persisted to localStorage)
  const [queryConfig, setQueryConfig] = useState<QueryConfig>(() => {
    const saved = localStorage.getItem("queryConfig");
    if (saved) {
      try {
        return { ...DEFAULT_QUERY_CONFIG, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_QUERY_CONFIG;
      }
    }
    return DEFAULT_QUERY_CONFIG;
  });

  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("queryConfig", JSON.stringify(queryConfig));
  }, [queryConfig]);

  // Cleanup abort controller and intervals on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
      if (retrievalProgressIntervalRef.current) {
        clearInterval(retrievalProgressIntervalRef.current);
        retrievalProgressIntervalRef.current = null;
      }
      if (generationProgressIntervalRef.current) {
        clearInterval(generationProgressIntervalRef.current);
        generationProgressIntervalRef.current = null;
      }
      if (uploadProgressIntervalRef.current) {
        clearInterval(uploadProgressIntervalRef.current);
        uploadProgressIntervalRef.current = null;
      }
    };
  }, [abortController]);

  const selectedDocument = documents.find((d) => d.id === selectedDocId);

  // Load conversation history when document changes
  useEffect(() => {
    if (selectedDocId) {
      const storedMessages = loadConversationHistory(selectedDocId);
      if (storedMessages.length > 0) {
        // Convert stored messages back to Message format
        const restoredMessages: Message[] = storedMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(restoredMessages);
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [selectedDocId]);

  // Save conversation history whenever messages change
  useEffect(() => {
    if (selectedDocId && messages.length > 0) {
      // Convert messages to storable format
      const storableMessages = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        citations: msg.citations,
        timestamp: msg.timestamp.toISOString(),
        status: msg.status,
        error: msg.error,
        canRetry: msg.canRetry,
      }));
      saveConversationHistory(selectedDocId, storableMessages);
    }
  }, [messages, selectedDocId]);

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
            // Store the document ID we're processing to ensure we don't switch to wrong document
            const processingDocId = selectedDocId;
            
            setTimeout(async () => {
              clearInterval(pollInterval);
              if (simulationTimeout) clearTimeout(simulationTimeout);
              
              try {
                const response = await documentsApi.list({ projectId: selectedProjectId });
                setDocuments(response.documents);
                
                // Ensure we're still processing the same document
                if (processingDocId) {
                  const updatedDoc = response.documents.find(d => d.id === processingDocId);
                  if (updatedDoc?.status === "ready") {
                    // Ensure selectedDocId is still set to the correct document before switching
                    setSelectedDocId(processingDocId);
                    setViewState("chat");
                    toast({
                      title: "Document Ready",
                      description: "Document has been processed and indexed. You can now query it.",
                    });
                  } else {
                    // Document not ready yet, but simulation completed - force switch anyway
                    console.warn("Simulation completed but document status is:", updatedDoc?.status);
                    if (viewState === "processing") {
                      setSelectedDocId(processingDocId);
                      setViewState("chat");
                    }
                  }
                }
              } catch (error) {
                console.error("Failed to reload documents after simulation:", error);
                // Still switch to chat view if we're in processing and document ID is valid
                if (viewState === "processing" && processingDocId) {
                  setSelectedDocId(processingDocId);
                  setViewState("chat");
                }
              }
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
        // Stop polling if simulation has started
        if (simulationStarted && backendCompleted) {
          return;
        }

        try {
          const status = await getProcessingStatus(selectedDocId);
          
          if (status) {
            // If backend completed but simulation hasn't started, start it
            if (status.progress === 100 && !backendCompleted) {
              backendCompleted = true;
              if (!simulationStarted) {
                // Stop polling before starting simulation
                clearInterval(pollInterval);
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
              if (doc.status === "ready") {
                if (!backendCompleted) {
                  backendCompleted = true;
                  // Stop polling before starting simulation
                  clearInterval(pollInterval);
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
                } else if (simulationStarted) {
                  // If simulation already started but view hasn't switched, check if we should switch
                  // This handles the case where simulation completed but view didn't switch
                  const currentDoc = documents.find(d => d.id === selectedDocId);
                  if (currentDoc?.status === "ready" && viewState === "processing") {
                    // Force switch to chat view if document is ready
                    setViewState("chat");
                  }
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
              // If document check fails and we haven't started simulation, continue polling
              // but don't spam errors if simulation already started
              if (simulationStarted) {
                return;
              }
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
        } catch (error: any) {
          // Handle 404 or other errors - check document status as fallback
          if (error?.message?.includes("404") || error?.message?.includes("Not Found")) {
            // Task not found, check document status
            try {
              const doc = await documentsApi.get(selectedDocId);
              if (doc.status === "ready") {
                if (!backendCompleted) {
                  backendCompleted = true;
                  // Stop polling before starting simulation
                  clearInterval(pollInterval);
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
                } else if (simulationStarted && viewState === "processing") {
                  // Simulation started but view didn't switch - force switch
                  const currentDoc = documents.find(d => d.id === selectedDocId);
                  if (currentDoc?.status === "ready") {
                    setViewState("chat");
                    toast({
                      title: "Document Ready",
                      description: "Document has been processed and indexed. You can now query it.",
                    });
                  }
                }
              }
            } catch (docError) {
              // Only log error if simulation hasn't started
              if (!simulationStarted) {
                console.error("Failed to check document status:", docError);
              }
            }
          } else if (!simulationStarted) {
            // Only log other errors if simulation hasn't started
            console.error("Failed to poll processing status:", error);
          }
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

  // Fetch document URL when document is selected AND we're in chat view (not during processing)
  useEffect(() => {
    const fetchDocumentUrl = async () => {
      // Only fetch blob URL when in chat view, not during processing
      // This prevents fetching blob URL for wrong document during processing
      if (selectedDocId && viewState === "chat") {
        try {
          const url = await documentsApi.getFileUrl(selectedDocId);
          setDocumentUrl(url);
        } catch (error) {
          console.error("Failed to get document URL:", error);
          setDocumentUrl(null);
        }
      } else if (!selectedDocId || viewState !== "chat") {
        // Clear document URL when not in chat view or no document selected
        setDocumentUrl(null);
      }
    };
    fetchDocumentUrl();
  }, [selectedDocId, viewState]);

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

    // Clear any existing upload interval
    if (uploadProgressIntervalRef.current) {
      clearInterval(uploadProgressIntervalRef.current);
      uploadProgressIntervalRef.current = null;
    }

    uploadProgressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 95));
    }, 150);

    try {
      // Upload file to backend
      const newDoc = await documentsApi.upload(file, projectId);
      
      if (uploadProgressIntervalRef.current) {
        clearInterval(uploadProgressIntervalRef.current);
        uploadProgressIntervalRef.current = null;
      }
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
      if (uploadProgressIntervalRef.current) {
        clearInterval(uploadProgressIntervalRef.current);
        uploadProgressIntervalRef.current = null;
      }
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
      
      // Update local documents state
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      
      // Clear selected document if it was deleted
      if (selectedDocId === id) {
        setSelectedDocId(null);
        setViewState("list");
      }
      
      // Clear selected documents in cross-document view if deleted
      setSelectedDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedDocIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // Reload documents list to ensure consistency
      const response = await documentsApi.list({ projectId: selectedProjectId });
      setDocuments(response.documents);
      
      // Trigger refresh in DocumentListView
      setDocumentListRefreshTrigger((prev) => prev + 1);
      
      toast({
        title: "Document Deleted",
        description: "The document has been removed.",
      });
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (message: string, retryMessageId?: string) => {
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

    // Cancel any existing query
    if (abortController) {
      abortController.abort();
    }

    // Create new AbortController for this query
    const controller = new AbortController();
    setAbortController(controller);
    setQueryStatus("retrieving");

    // Remove retry message if retrying
    if (retryMessageId) {
      setMessages((prev) => prev.filter((msg) => msg.id !== retryMessageId));
    }

    // Add user message to UI immediately (if not retrying)
    if (!retryMessageId) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    // Create placeholder assistant message with status
    const assistantMessageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "retrieving",
    };
    setMessages((prev) => [...prev, placeholderMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages, excluding the placeholder)
      const conversationHistory = messages
        .filter((msg) => msg.id !== assistantMessageId)
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Check cache first
      const cachedResponse = getCachedQuery(
        message,
        [selectedDocument.id],
        DEFAULT_COLLECTION_NAME,
        queryConfig
      );

      let response;
      if (cachedResponse) {
        // Use cached response
        response = cachedResponse;
        setQueryStatus("completed");
      } else {
        // Update status to retrieving with progress tracking
        setQueryStatus("retrieving");
        setLoadingProgress({ phase: "retrieving", progress: 0, estimatedTimeRemaining: 5 });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, status: "retrieving" } : msg
          )
        );

        // Clear any existing intervals
        if (retrievalProgressIntervalRef.current) {
          clearInterval(retrievalProgressIntervalRef.current);
          retrievalProgressIntervalRef.current = null;
        }
        if (generationProgressIntervalRef.current) {
          clearInterval(generationProgressIntervalRef.current);
          generationProgressIntervalRef.current = null;
        }

        // Simulate retrieval phase with progress updates
        const retrievalStartTime = Date.now();
        const retrievalDuration = 800; // Estimated 800ms for retrieval
        retrievalProgressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - retrievalStartTime;
          const progress = Math.min((elapsed / retrievalDuration) * 100, 90);
          const remaining = Math.max((retrievalDuration - elapsed) / 1000, 0);
          setLoadingProgress({
            phase: "retrieving",
            progress: Math.round(progress),
            estimatedTimeRemaining: Math.round(remaining),
          });
        }, 100);

        await new Promise((resolve) => setTimeout(resolve, retrievalDuration));
        if (retrievalProgressIntervalRef.current) {
          clearInterval(retrievalProgressIntervalRef.current);
          retrievalProgressIntervalRef.current = null;
        }

        // Update status to generating with progress tracking
        setQueryStatus("generating");
        setLoadingProgress({ phase: "generating", progress: 0, estimatedTimeRemaining: 10 });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, status: "generating" } : msg
          )
        );

        // Prepare query request with config
        const queryRequest: QueryRequest = {
          query: message,
          collection_name: DEFAULT_COLLECTION_NAME,
          document_ids: [selectedDocument.id], // Limit to current document
          conversation_history: conversationHistory,
          generate_insights: queryConfig.generate_insights,
          search_type: queryConfig.search_type,
          top_k: queryConfig.top_k,
          rerank_enabled: queryConfig.rerank_enabled,
          temperature: queryConfig.temperature,
          max_tokens: queryConfig.max_tokens,
        };

        // Track generation progress
        const generationStartTime = Date.now();
        generationProgressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - generationStartTime;
          // Estimate generation takes 5-15 seconds, show progress accordingly
          const estimatedDuration = 10000; // 10 seconds estimate
          const progress = Math.min((elapsed / estimatedDuration) * 100, 95);
          const remaining = Math.max((estimatedDuration - elapsed) / 1000, 0);
          setLoadingProgress({
            phase: "generating",
            progress: Math.round(progress),
            estimatedTimeRemaining: Math.round(remaining),
          });
        }, 200);

        try {
          // Call query API with abort signal
          response = await queryApi.query(queryRequest, controller.signal);
          if (generationProgressIntervalRef.current) {
            clearInterval(generationProgressIntervalRef.current);
            generationProgressIntervalRef.current = null;
          }
          
          // Cache the response
          cacheQuery(
            message,
            [selectedDocument.id],
            DEFAULT_COLLECTION_NAME,
            queryConfig,
            response
          );
          setQueryStatus("completed");
          setLoadingProgress({ phase: "generating", progress: 100 });
        } catch (queryError) {
          // Clear all intervals on error
          if (retrievalProgressIntervalRef.current) {
            clearInterval(retrievalProgressIntervalRef.current);
            retrievalProgressIntervalRef.current = null;
          }
          if (generationProgressIntervalRef.current) {
            clearInterval(generationProgressIntervalRef.current);
            generationProgressIntervalRef.current = null;
          }
          throw queryError;
        }
      }

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

      // Update assistant message with response
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: formattedAnswer,
        citations: citations,
        timestamp: new Date(response.generated_at),
        status: "completed",
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMessageId ? assistantMessage : msg))
      );
    } catch (error) {
      console.error("Query failed:", error);
      
      // Categorize error for better handling
      const categorizedError = categorizeError(error);
      
      // Log detailed error for debugging (except cancelled queries)
      if (categorizedError.type !== ErrorType.CANCELLED && categorizedError.originalError) {
        console.error("Error details:", {
          type: categorizedError.type,
          message: categorizedError.message,
          stack: categorizedError.originalError.stack,
          name: categorizedError.originalError.name,
        });
      }
      
      // Show toast notification for non-cancelled errors
      if (categorizedError.type !== ErrorType.CANCELLED) {
        let toastTitle = "Query Failed";
        if (categorizedError.type === ErrorType.NETWORK) {
          toastTitle = "Connection Error";
        } else if (categorizedError.type === ErrorType.TIMEOUT) {
          toastTitle = "Request Timeout";
        } else if (categorizedError.type === ErrorType.API) {
          toastTitle = "Server Error";
        } else if (categorizedError.type === ErrorType.VALIDATION) {
          toastTitle = "Invalid Request";
        }

        toast({
          title: toastTitle,
          description: categorizedError.userMessage,
          variant: "destructive",
        });
      }

      // Update message with error status
      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: categorizedError.type === ErrorType.CANCELLED
          ? "Query was cancelled."
          : categorizedError.userMessage,
        timestamp: new Date(),
        status: categorizedError.type === ErrorType.CANCELLED ? "cancelled" : "error",
        error: categorizedError.message,
        canRetry: categorizedError.canRetry,
      };
      
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMessageId ? errorMessage : msg))
      );
      setQueryStatus(categorizedError.type === ErrorType.CANCELLED ? "cancelled" : "error");
      setLoadingProgress(null);
    } finally {
      setIsLoading(false);
      setAbortController(null);
      setQueryStatus("idle");
      setLoadingProgress(null);
    }
  };

  const handleCancelQuery = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setQueryStatus("cancelled");
      setIsLoading(false);
    }
  };

  const handleRetryQuery = (messageId: string) => {
    // Find the error message and the user message before it
    const errorIndex = messages.findIndex((msg) => msg.id === messageId);
    if (errorIndex > 0) {
      const userMessage = messages[errorIndex - 1];
      if (userMessage.role === "user") {
        // Remove the error message and retry with the user's query
        handleSendMessage(userMessage.content, messageId);
      }
    }
  };

  const handleClearHistory = () => {
    if (selectedDocId) {
      clearConversationHistory(selectedDocId);
    }
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "Conversation history has been cleared.",
    });
  };

  const handleProjectSelect = async (projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      try {
        // Load project details for breadcrumb/title
        const hierarchy = await projectsApi.getHierarchy();
        const findProject = (projects: any[], id: string): any | null => {
          for (const p of projects) {
            if (p.id === id) return p;
            if (p.children) {
              const found = findProject(p.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const project = findProject(hierarchy, projectId);
        if (project) {
          setSelectedProject({ id: project.id, name: project.name });
        }
      } catch (error) {
        console.error("Failed to load project:", error);
      }
    } else {
      setSelectedProject(null);
    }
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
            queryStatus={queryStatus}
            onCancelQuery={handleCancelQuery}
            onRetryQuery={handleRetryQuery}
            onCitationClick={(citation) => {
              // Handle citation click - scroll to page in document viewer
              toast({
                title: "Citation",
                description: `Navigating to ${citation.page ? `page ${citation.page}` : citation.section || "citation"}`,
              });
            }}
            queryConfig={queryConfig}
            onQueryConfigChange={setQueryConfig}
            loadingProgress={loadingProgress}
          />
        );

      case "list":
        // Show ProjectView if a project is selected, otherwise show DocumentListView
        if (selectedProjectId) {
          return (
            <ProjectView
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
              onOpenSavedAnalyses={() => setSavedAnalysesDialogOpen(true)}
              refreshTrigger={documentListRefreshTrigger}
              onDocumentDeleted={(id) => {
                // Update parent documents state
                setDocuments((prev) => prev.filter((d) => d.id !== id));
                // Clear selected document if it was deleted
                if (selectedDocId === id) {
                  setSelectedDocId(null);
                  setViewState("list");
                }
                // Clear selected documents in cross-document view if deleted
                setSelectedDocuments((prev) => prev.filter((d) => d.id !== id));
                setSelectedDocIds((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(id);
                  return newSet;
                });
              }}
              onProjectSelect={handleProjectSelect}
            />
          );
        }
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
            onOpenSavedAnalyses={() => setSavedAnalysesDialogOpen(true)}
            refreshTrigger={documentListRefreshTrigger}
            onDocumentDeleted={(id) => {
              // Update parent documents state
              setDocuments((prev) => prev.filter((d) => d.id !== id));
              // Clear selected document if it was deleted
              if (selectedDocId === id) {
                setSelectedDocId(null);
                setViewState("list");
              }
              // Clear selected documents in cross-document view if deleted
              setSelectedDocuments((prev) => prev.filter((d) => d.id !== id));
              setSelectedDocIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            }}
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
            onLoadAnalysis={(documentIds) => {
              // Find documents by IDs
              const docsToLoad = documents.filter((d) => documentIds.includes(d.id));
              if (docsToLoad.length >= 2) {
                setSelectedDocuments(docsToLoad);
                setSelectedDocIds(new Set(documentIds));
                
                // Fetch URLs for selected documents
                const urlMap = new Map<string, string>();
                docsToLoad.forEach(async (doc) => {
                  try {
                    const url = await documentsApi.getFileUrl(doc.id);
                    if (url) {
                      urlMap.set(doc.id, url);
                      setDocumentUrls((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(doc.id, url);
                        return newMap;
                      });
                    }
                  } catch (error) {
                    console.error(`Failed to get URL for document ${doc.id}:`, error);
                  }
                });
                
                setViewState("cross-document");
                toast({
                  title: "Analysis Loaded",
                  description: `Loaded analysis for ${docsToLoad.length} documents.`,
                });
              } else {
                toast({
                  title: "Error",
                  description: "Could not find all documents for this analysis.",
                  variant: "destructive",
                });
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

  const handleTagFilter = (tagId: string) => {
    // Set tag filter in URL params and refresh document list
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tag', tagId);
      return newParams;
    });
    setDocumentListRefreshTrigger((prev) => prev + 1);
    setViewState("list");
    toast({
      title: "Filter applied",
      description: "Documents filtered by tag",
    });
  };


  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
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
        onTagFilter={handleTagFilter}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalNavBar onSearch={handleGlobalSearch} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a]">
          {/* Render directly for multi-select and cross-document views */}
          {(viewState === "multi-select" || viewState === "cross-document") ? (
            renderContent()
          ) : (
            <Tabs value={viewState} onValueChange={(v) => setViewState(v as ViewState)} className="h-full flex flex-col">
              {viewState === "list" || (viewState === "chat" && selectedDocument) ? (
                <div className="border-b border-[#e5e5e5] dark:border-[#262626] px-4 pt-2 pb-0">
                  <TabsList className="bg-transparent h-8">
                    <TabsTrigger value="list" className="text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#171717] dark:data-[state=active]:border-[#fafafa] data-[state=active]:rounded-none w-[100px] justify-center h-7">
                      {selectedProject ? selectedProject.name : "Documents"}
                    </TabsTrigger>
                    {selectedDocument && (
                      <TabsTrigger 
                        value="chat" 
                        disabled={selectedDocument.status !== "ready"}
                        className="text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#171717] dark:data-[state=active]:border-[#fafafa] data-[state=active]:rounded-none w-[100px] justify-center h-7"
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

      {/* Saved Analyses Dialog */}
      <SavedAnalysesDialog
        open={savedAnalysesDialogOpen}
        onOpenChange={setSavedAnalysesDialogOpen}
        onSelectAnalysis={(selectedDocumentIds) => {
          // Find documents by IDs
          const docsToLoad = documents.filter((d) => selectedDocumentIds.includes(d.id));
          if (docsToLoad.length >= 2) {
            setSelectedDocuments(docsToLoad);
            setSelectedDocIds(new Set(selectedDocumentIds));
            
            // Fetch URLs for selected documents
            const urlMap = new Map<string, string>();
            docsToLoad.forEach(async (doc) => {
              try {
                const url = await documentsApi.getFileUrl(doc.id);
                if (url) {
                  urlMap.set(doc.id, url);
                  setDocumentUrls((prev) => {
                    const newMap = new Map(prev);
                    newMap.set(doc.id, url);
                    return newMap;
                  });
                }
              } catch (error) {
                console.error(`Failed to get URL for document ${doc.id}:`, error);
              }
            });
            
            setViewState("cross-document");
            toast({
              title: "Analysis Loaded",
              description: `Loaded analysis for ${docsToLoad.length} documents.`,
            });
          } else {
            toast({
              title: "Error",
              description: "Could not find all documents for this analysis.",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
};

export default Documents;
