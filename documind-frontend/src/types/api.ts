// API Types and Interfaces

export interface Project {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  documentCount?: number;
  children?: Project[];
}

export interface Document {
  id: string;
  name: string;
  status: "processing" | "ready" | "error";
  uploadedAt: Date;
  uploadedBy: string;
  size: number; // in bytes
  type: string; // file extension
  projectId?: string | null;
  tags: string[];
  metadata?: {
    pageCount?: number;
    language?: string;
    [key: string]: any;
  };
  securityScan?: SecurityScanResult;
  processingStatus?: ProcessingStatus;
}

export interface SecurityScanResult {
  status: "pending" | "scanning" | "clean" | "threat_detected" | "error";
  scannedAt?: Date;
  malwareScan?: {
    status: "pending" | "scanning" | "clean" | "threat_detected" | "error";
    scannedAt?: Date;
    threats?: SecurityThreat[];
  };
  virusScan?: {
    status: "pending" | "scanning" | "clean" | "threat_detected" | "error";
    scannedAt?: Date;
    threats?: SecurityThreat[];
  };
  error?: string;
}

export interface SecurityThreat {
  type: "malware" | "virus" | "suspicious_content" | "phishing";
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: Date;
}

export interface ProcessingStatus {
  currentStep: string;
  progress: number; // 0-100
  steps: ProcessingStepStatus[];
  ocrStatus?: OCRStatus;
  error?: ProcessingError;
  queuePosition?: number;
  estimatedTimeRemaining?: number; // in seconds
}

export interface ProcessingStepStatus {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface OCRStatus {
  status: "not_required" | "pending" | "processing" | "completed" | "error";
  progress?: number; // 0-100
  pagesProcessed?: number;
  totalPages?: number;
  language?: string;
  error?: string;
}

export interface ProcessingError {
  code: string;
  message: string;
  step: string;
  occurredAt: Date;
  recoverable: boolean;
  retryCount?: number;
}

export interface DocumentTag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Profile Settings Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationPreferences {
  emailNotifications: {
    documentProcessed: boolean;
    documentShared: boolean;
    comments: boolean;
    mentions: boolean;
    weeklyDigest: boolean;
  };
  inAppNotifications: {
    documentProcessed: boolean;
    documentShared: boolean;
    comments: boolean;
    mentions: boolean;
  };
  pushNotifications: {
    documentProcessed: boolean;
    documentShared: boolean;
    comments: boolean;
    mentions: boolean;
  };
}

export interface UpdateNotificationPreferencesRequest {
  emailNotifications?: Partial<NotificationPreferences["emailNotifications"]>;
  inAppNotifications?: Partial<NotificationPreferences["inAppNotifications"]>;
  pushNotifications?: Partial<NotificationPreferences["pushNotifications"]>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterParams {
  projectId?: string | null;
  status?: Document["status"][];
  fileType?: string[];
  tags?: string[];
  uploadedBy?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProjectListResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BulkActionRequest {
  documentIds: string[];
  action: "delete" | "tag" | "move" | "untag";
  payload?: {
    tags?: string[];
    projectId?: string | null;
  };
}

// Insights Types
export interface DocumentInsights {
  summary: DocumentSummary;
  entities: DocumentEntities;
  suggestedQuestions: string[];
}

export interface DocumentSummary {
  executiveSummary: string;
  keyPoints: string[];
  generatedAt: Date;
}

export interface DocumentEntities {
  organizations: Entity[];
  people: Entity[];
  dates: Entity[];
  monetaryValues: MonetaryEntity[];
  locations?: Entity[];
}

export interface Entity {
  text: string;
  context?: string;
  page?: number;
  count?: number;
}

export interface MonetaryEntity extends Entity {
  value: number;
  currency: string;
  formatted: string;
}

// Cross-Document Analysis Types
export interface CrossDocumentQueryRequest {
  documentIds: string[];
  query: string;
  includePatterns?: boolean;
  includeContradictions?: boolean;
}

export interface CrossDocumentQueryResponse {
  answer: string;
  citations: CrossDocumentCitation[];
  patterns?: DocumentPattern[];
  contradictions?: DocumentContradiction[];
  generatedAt: Date;
}

export interface CrossDocumentCitation {
  documentId: string;
  documentName: string;
  text: string;
  page?: number;
  section?: string;
  relevanceScore?: number;
}

export interface DocumentPattern {
  type: "theme" | "entity" | "trend" | "relationship";
  description: string;
  documents: string[]; // document IDs
  occurrences: number;
  examples: Array<{
    documentId: string;
    documentName: string;
    text: string;
    page?: number;
  }>;
  confidence: number; // 0-1
}

// Query API Types
export interface QueryRequest {
  query: string;
  collection_name: string;
  document_ids?: string[];
  generate_insights?: boolean;
  conversation_history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  top_k?: number;
  search_type?: "vector" | "keyword" | "hybrid";
  rerank_enabled?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface QueryResponse {
  answer: string;
  citations: CitationResponse[];
  confidence: number;
  key_points?: KeyPointResponse[];
  entities?: EntityResponse[];
  patterns?: Array<{
    type: string;
    description: string;
    documents: string[];
    occurrences: number;
    examples: Array<{
      document_id: string;
      document_name: string;
      text: string;
      page?: number;
    }>;
    confidence: number;
  }>;
  contradictions?: Array<{
    type: string;
    description: string;
    documents: Array<{
      id: string;
      name: string;
      claim: string;
      page?: number;
      section?: string;
    }>;
    severity: string;
    confidence: number;
  }>;
  model: string;
  provider: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  metadata: Record<string, any>;
  generated_at: string;
}

export interface CitationResponse {
  index: number;
  document_id: string;
  chunk_id: string;
  page?: number;
  score: number;
  metadata: Record<string, any>;
}

export interface KeyPointResponse {
  text: string;
  importance: number;
  citations: number[];
}

export interface EntityResponse {
  text: string;
  type: string;
  value?: any;
  citations: number[];
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  answer: string;
  collection_name: string;
  document_ids: string[];
  created_at: string;
  metadata: Record<string, any>;
}

export interface QueryHistoryResponse {
  items: QueryHistoryItem[];
  total: number;
}

export interface DocumentContradiction {
  type: "factual" | "temporal" | "quantitative" | "categorical";
  description: string;
  documents: Array<{
    id: string;
    name: string;
    claim: string;
    page?: number;
    section?: string;
  }>;
  severity: "low" | "medium" | "high";
  confidence: number; // 0-1
}

export interface DocumentComparison {
  documentIds: string[];
  similarities: ComparisonSimilarity[];
  differences: ComparisonDifference[];
  generatedAt: Date;
}

export interface ComparisonSimilarity {
  aspect: string;
  description: string;
  documents: string[]; // document IDs
  examples: Array<{
    documentId: string;
    text: string;
    page?: number;
  }>;
}

export interface ComparisonDifference {
  aspect: string;
  description: string;
  documents: Array<{
    id: string;
    name: string;
    value: string;
    page?: number;
  }>;
}

// Collaboration & Sharing Types
export type SharePermission = "view" | "comment" | "edit";
export type ShareAccess = "anyone" | "team" | "specific";

export interface ShareLink {
  id: string;
  documentId: string;
  shareToken: string;
  shareUrl: string;
  permission: SharePermission;
  access: ShareAccess;
  allowedUsers?: string[]; // User IDs
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface CreateShareLinkRequest {
  documentId: string;
  permission: SharePermission;
  access: ShareAccess;
  allowedUsers?: string[];
  expiresAt?: Date;
}

export interface UpdateShareLinkRequest {
  permission?: SharePermission;
  access?: ShareAccess;
  allowedUsers?: string[];
  expiresAt?: Date;
  isActive?: boolean;
}

export interface Comment {
  id: string;
  documentId: string;
  content: string;
  page?: number;
  x?: number; // Position on page (for annotations)
  y?: number;
  createdBy: string;
  createdByUser?: User;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
  parentId?: string; // For reply comments
  resolved?: boolean;
}

export interface CreateCommentRequest {
  documentId: string;
  content: string;
  page?: number;
  x?: number;
  y?: number;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content?: string;
  resolved?: boolean;
}

export interface Annotation {
  id: string;
  documentId: string;
  type: "highlight" | "note" | "drawing" | "text";
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  content?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnnotationRequest {
  documentId: string;
  type: Annotation["type"];
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  content?: string;
}

// Export Types
export type ExportFormat = "pdf" | "docx" | "xlsx" | "txt" | "json";

export interface ExportRequest {
  documentId?: string;
  format: ExportFormat;
  includeChatHistory?: boolean;
  includeSummary?: boolean;
  includeAnnotations?: boolean;
  chatMessages?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  summary?: DocumentSummary;
}

export interface AnalysisShareLink {
  id: string;
  documentId: string;
  shareToken: string;
  shareUrl: string;
  includesChatHistory: boolean;
  includesSummary: boolean;
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

