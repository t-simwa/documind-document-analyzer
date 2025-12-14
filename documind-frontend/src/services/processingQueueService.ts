// Processing Queue Management Service
// Manages document processing queue and status updates

import type { ProcessingStatus, ProcessingStepStatus, ProcessingError, OCRStatus } from "@/types/api";
import { tasksApi } from "./api";
import { API_BASE_URL } from "@/config/api";

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Map backend task status to frontend processing step
function mapBackendStatusToFrontendStep(taskResult: any): string | null {
  if (!taskResult?.status) return null;
  
  switch (taskResult.status) {
    case "ingested":
      return "extract";
    case "chunked":
      return "chunk";
    case "embedded":
      return "embed";
    case "processed":
      return "index";  // Final step - document is indexed and ready
    default:
      return null;
  }
}

// Processing queue (in production, this would be managed by the backend)
interface QueueItem {
  documentId: string;
  fileName: string;
  priority: number;
  addedAt: Date;
  status: "queued" | "processing" | "completed" | "error";
}

let processingQueue: QueueItem[] = [];
let processingCallbacks: Map<string, (status: ProcessingStatus) => void> = new Map();

// Processing steps configuration
const PROCESSING_STEPS: Array<{ id: string; label: string; duration: number }> = [
  { id: "upload", label: "Secure Upload", duration: 500 },
  { id: "security_scan", label: "Security Scan", duration: 2000 },
  { id: "extract", label: "Text Extraction", duration: 1500 },
  { id: "ocr", label: "OCR Processing", duration: 3000 },
  { id: "chunk", label: "Smart Chunking", duration: 1000 },
  { id: "embed", label: "Vector Embeddings", duration: 2000 },
  { id: "index", label: "Indexing", duration: 1500 },
];

// Check if file type requires OCR
function requiresOCR(fileType: string, fileName: string): boolean {
  const imageTypes = ["image/png", "image/jpeg", "image/jpg", "image/tiff", "image/bmp"];
  const imageExtensions = [".png", ".jpg", ".jpeg", ".tiff", ".bmp"];
  
  return imageTypes.includes(fileType) || 
         imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

// Simulate processing a document
export async function processDocument(
  documentId: string,
  fileName: string,
  fileType: string,
  onStatusUpdate?: (status: ProcessingStatus) => void
): Promise<ProcessingStatus> {
  const needsOCR = requiresOCR(fileType, fileName);
  const steps = PROCESSING_STEPS.filter(step => {
    // Skip OCR step if not needed
    if (step.id === "ocr" && !needsOCR) {
      return false;
    }
    return true;
  });

  let currentStepIndex = 0;
  const stepStatuses: ProcessingStepStatus[] = steps.map(step => ({
    id: step.id,
    label: step.label,
    status: "pending",
  }));

  // Update status function
  const updateStatus = (updates: Partial<ProcessingStatus>) => {
    const status: ProcessingStatus = {
      currentStep: steps[currentStepIndex]?.id || "",
      progress: Math.round(((currentStepIndex + 1) / steps.length) * 100),
      steps: stepStatuses,
      queuePosition: 0,
      ...updates,
    };

    if (onStatusUpdate) {
      onStatusUpdate(status);
    }
    return status;
  };

  try {
    // Process each step
    for (let i = 0; i < steps.length; i++) {
      currentStepIndex = i;
      const step = steps[i];
      const stepStatus = stepStatuses[i];

      // Update step to processing
      stepStatus.status = "processing";
      stepStatus.startedAt = new Date();
      updateStatus({});

      // Simulate processing time
      await delay(step.duration);

      // Handle OCR step specially
      if (step.id === "ocr" && needsOCR) {
        const ocrStatus: OCRStatus = {
          status: "processing",
          progress: 0,
          pagesProcessed: 0,
          totalPages: 10, // Mock page count
          language: "en",
        };

        // Simulate OCR progress
        for (let page = 0; page < 10; page++) {
          await delay(200);
          ocrStatus.pagesProcessed = page + 1;
          ocrStatus.progress = Math.round(((page + 1) / 10) * 100);
          updateStatus({ ocrStatus: { ...ocrStatus } });
        }

        ocrStatus.status = "completed";
        updateStatus({ ocrStatus });
      }

      // Simulate random errors (5% chance) for testing error recovery
      if (Math.random() < 0.05 && step.id !== "upload" && step.id !== "security_scan") {
        const error: ProcessingError = {
          code: "PROCESSING_ERROR",
          message: `Error occurred during ${step.label}`,
          step: step.id,
          occurredAt: new Date(),
          recoverable: true,
          retryCount: 0,
        };

        stepStatus.status = "error";
        stepStatus.error = error.message;
        updateStatus({ error });

        // Simulate error recovery
        await delay(500);
        stepStatus.status = "processing";
        stepStatus.error = undefined;
        updateStatus({ error: undefined });
      }

      // Mark step as completed
      stepStatus.status = "completed";
      stepStatus.completedAt = new Date();
      updateStatus({});
    }

    // Final status
    const finalStatus: ProcessingStatus = {
      currentStep: "",
      progress: 100,
      steps: stepStatuses,
      queuePosition: 0,
      ocrStatus: needsOCR ? {
        status: "completed",
        progress: 100,
        pagesProcessed: 10,
        totalPages: 10,
        language: "en",
      } : { status: "not_required" },
    };

    if (onStatusUpdate) {
      onStatusUpdate(finalStatus);
    }

    return finalStatus;
  } catch (error) {
    const processingError: ProcessingError = {
      code: "PROCESSING_FAILED",
      message: error instanceof Error ? error.message : "Unknown processing error",
      step: steps[currentStepIndex]?.id || "unknown",
      occurredAt: new Date(),
      recoverable: false,
    };

    const errorStatus: ProcessingStatus = {
      currentStep: steps[currentStepIndex]?.id || "",
      progress: Math.round((currentStepIndex / steps.length) * 100),
      steps: stepStatuses,
      error: processingError,
    };

    if (onStatusUpdate) {
      onStatusUpdate(errorStatus);
    }

    throw error;
  }
}

// Add document to processing queue
export async function addToQueue(
  documentId: string,
  fileName: string,
  priority: number = 0
): Promise<void> {
  await delay(100);
  processingQueue.push({
    documentId,
    fileName,
    priority,
    addedAt: new Date(),
    status: "queued",
  });

  // Sort by priority (higher priority first)
  processingQueue.sort((a, b) => b.priority - a.priority);
}

// Get queue position for a document
export async function getQueuePosition(documentId: string): Promise<number> {
  await delay(100);
  const index = processingQueue.findIndex(item => item.documentId === documentId);
  return index >= 0 ? index + 1 : 0;
}

// Remove document from queue
export async function removeFromQueue(documentId: string): Promise<void> {
  await delay(100);
  processingQueue = processingQueue.filter(item => item.documentId !== documentId);
}

// Retry processing after error
export async function retryProcessing(
  documentId: string,
  fileName: string,
  fileType: string,
  onStatusUpdate?: (status: ProcessingStatus) => void
): Promise<ProcessingStatus> {
  await delay(200);
  return processDocument(documentId, fileName, fileType, onStatusUpdate);
}

// Get processing status from backend
export async function getProcessingStatus(documentId: string): Promise<ProcessingStatus | null> {
  const taskId = `doc_process_${documentId}`;
  
  try {
    const task = await tasksApi.getTaskStatus(taskId);
    
    if (!task) {
      // Task not found - might be due to server reload
      // Check document status as fallback
      try {
        // Import documentsApi dynamically to avoid circular dependency
        const { documentsApi } = await import('./api');
        const doc = await documentsApi.get(documentId);
        
        if (doc.status === "ready") {
          // Document is ready, return completed status
          const steps: ProcessingStepStatus[] = [
            { id: "upload", label: "Secure Upload", status: "completed" },
            { id: "security_scan", label: "Security Scan", status: "completed" },
            { id: "extract", label: "Text Extraction", status: "completed" },
            { id: "ocr", label: "OCR Processing", status: "completed" },
            { id: "chunk", label: "Smart Chunking", status: "completed" },
            { id: "embed", label: "Vector Embeddings", status: "completed" },
            { id: "index", label: "Indexing", status: "completed" },
          ];
          return {
            currentStep: "",
            progress: 100,
            steps,
            queuePosition: 0,
          };
        } else if (doc.status === "error") {
          // Document processing failed
          const steps: ProcessingStepStatus[] = [
            { id: "upload", label: "Secure Upload", status: "completed" },
            { id: "security_scan", label: "Security Scan", status: "completed" },
            { id: "extract", label: "Text Extraction", status: "error" },
            { id: "ocr", label: "OCR Processing", status: "pending" },
            { id: "chunk", label: "Smart Chunking", status: "pending" },
            { id: "embed", label: "Vector Embeddings", status: "pending" },
            { id: "index", label: "Indexing", status: "pending" },
          ];
          return {
            currentStep: "extract",
            progress: 0,
            steps,
            queuePosition: 0,
            error: {
              code: "PROCESSING_FAILED",
              message: "Document processing failed",
              step: "extract",
              occurredAt: new Date(),
              recoverable: true,
            },
          };
        }
        // Document is still processing, return null to continue polling
        return null;
      } catch (docError) {
        // Document not found either, return null
        console.error("Failed to get document status:", docError);
        return null;
      }
    }

    return mapTaskToProcessingStatus(task, documentId);
  } catch (error: any) {
    // Handle other errors
    console.error("Failed to get processing status:", error);
  return null;
  }
}

function mapTaskToProcessingStatus(task: any, documentId: string): ProcessingStatus {
  const steps: ProcessingStepStatus[] = [
    { id: "upload", label: "Secure Upload", status: "completed" },
    { id: "security_scan", label: "Security Scan", status: "completed" },
    { id: "extract", label: "Text Extraction", status: "pending" },
    { id: "ocr", label: "OCR Processing", status: "pending" },
    { id: "chunk", label: "Smart Chunking", status: "pending" },
    { id: "embed", label: "Vector Embeddings", status: "pending" },
    { id: "index", label: "Indexing", status: "pending" },
  ];

  // Map backend task status to frontend steps
  // Check if task has a step field (new format) or use status mapping (old format)
  let currentStepId: string | null = null;
  
  if (task.result?.step) {
    // New format: step is explicitly provided
    currentStepId = task.result.step;
  } else if (task.result?.status) {
    // Old format: map status to step
    currentStepId = mapBackendStatusToFrontendStep(task.result);
  }
  
  if (currentStepId) {
    const stepIndex = steps.findIndex(s => s.id === currentStepId);
    if (stepIndex >= 0) {
      // Mark current step as in_progress if still processing
      if (task.status === "processing") {
        steps[stepIndex].status = "in_progress";
        steps[stepIndex].startedAt = new Date();
      } else {
        // Task completed this step
        steps[stepIndex].status = "completed";
        steps[stepIndex].completedAt = new Date();
      }
      
      // Mark all previous steps as completed
      for (let i = 0; i < stepIndex; i++) {
        steps[i].status = "completed";
        if (task.updated_at) {
          steps[i].completedAt = new Date(task.updated_at);
        }
      }
    }
  }
  
  // If task is completed, mark all steps as completed
  if (task.status === "completed") {
    steps.forEach(step => {
      if (step.status !== "completed") {
        step.status = "completed";
        if (task.updated_at) {
          step.completedAt = new Date(task.updated_at);
        }
      }
    });
  }

  // Handle task status
  if (task.status === "failed") {
    const currentStepIndex = steps.findIndex(s => s.status === "processing");
    if (currentStepIndex >= 0) {
      steps[currentStepIndex].status = "error";
      steps[currentStepIndex].error = task.error || "Processing failed";
    }
  }

  // Calculate progress
  const completedCount = steps.filter(s => s.status === "completed").length;
  const progress = Math.round((completedCount / steps.length) * 100);
  
  // Determine current step
  // First check for in_progress step, then processing, then completed
  let currentStepIndex = steps.findIndex(s => s.status === "in_progress");
  if (currentStepIndex < 0) {
    currentStepIndex = steps.findIndex(s => s.status === "processing");
  }
  const currentStep = currentStepIndex >= 0 
    ? steps[currentStepIndex].id 
    : (task.status === "completed" ? "" : (currentStepId || steps[0].id));

  return {
    currentStep,
    progress,
    steps,
    queuePosition: 0,
    // Add error if task failed
    ...(task.status === "failed" && {
      error: {
        code: "PROCESSING_FAILED",
        message: task.error || "Document processing failed",
        step: currentStep,
        occurredAt: new Date(task.updated_at),
        recoverable: true,
      },
    }),
  };
}

