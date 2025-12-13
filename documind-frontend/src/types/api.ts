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

