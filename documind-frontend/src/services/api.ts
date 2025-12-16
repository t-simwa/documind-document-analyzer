// API Service Layer
// This is a mock implementation that can be easily replaced with real API calls

import type {
  Project,
  Document,
  DocumentTag,
  User,
  PaginationParams,
  SortParams,
  FilterParams,
  DocumentListResponse,
  ProjectListResponse,
  BulkActionRequest,
  DocumentInsights,
  CrossDocumentQueryRequest,
  CrossDocumentQueryResponse,
  DocumentComparison,
  ShareLink,
  CreateShareLinkRequest,
  UpdateShareLinkRequest,
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  Annotation,
  CreateAnnotationRequest,
  ExportRequest,
  ExportFormat,
  AnalysisShareLink,
  UserProfile,
  UpdateUserProfileRequest,
  ChangePasswordRequest,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
  SecurityScanResult,
  ProcessingStatus,
  QueryRequest,
  QueryResponse,
  QueryHistoryResponse,
} from "@/types/api";
import { performSecurityScan } from "./securityScanService";
import { processDocument, retryProcessing } from "./processingQueueService";
import { API_BASE_URL, DEFAULT_COLLECTION_NAME } from "@/config/api";

// Mock data storage (in a real app, this would be API calls)
let mockProjects: Project[] = [
  {
    id: "1",
    name: "Default Project",
    description: "Default project for documents",
    parentId: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    createdBy: "user1",
    documentCount: 0,
    children: [],
  },
];

let mockDocuments: Document[] = [];
// Store file blobs/URLs for mock documents
const documentFileMap = new Map<string, string>(); // documentId -> blob URL
let mockTags: DocumentTag[] = [
  { id: "1", name: "Important", color: "#ef4444", createdAt: new Date() },
  { id: "2", name: "Review", color: "#f59e0b", createdAt: new Date() },
  { id: "3", name: "Archive", color: "#6b7280", createdAt: new Date() },
];

let mockUsers: User[] = [
  { id: "user1", name: "Current User", email: "user@example.com" },
];

// Mock user profile data
let mockUserProfile: UserProfile = {
  id: "user1",
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: undefined,
  phone: "+1 (555) 123-4567",
  bio: "Document analyst and AI enthusiast",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Mock notification preferences
let mockNotificationPreferences: NotificationPreferences = {
  emailNotifications: {
    documentProcessed: true,
    documentShared: true,
    comments: true,
    mentions: true,
    weeklyDigest: false,
  },
  inAppNotifications: {
    documentProcessed: true,
    documentShared: true,
    comments: true,
    mentions: true,
  },
  pushNotifications: {
    documentProcessed: false,
    documentShared: false,
    comments: true,
    mentions: true,
  },
};

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Projects API
export const projectsApi = {
  async list(params?: PaginationParams): Promise<ProjectListResponse> {
    await delay(300);
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      projects: mockProjects.slice(start, end),
      pagination: {
        page,
        limit,
        total: mockProjects.length,
        totalPages: Math.ceil(mockProjects.length / limit),
        hasNext: end < mockProjects.length,
        hasPrev: page > 1,
      },
    };
  },

  async get(id: string): Promise<Project> {
    await delay(200);
    const project = mockProjects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    return project;
  },

  async create(data: { name: string; description?: string; parentId?: string | null }): Promise<Project> {
    await delay(400);
    const newProject: Project = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      parentId: data.parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "user1",
      documentCount: 0,
      children: [],
    };
    mockProjects.push(newProject);
    return newProject;
  },

  async update(id: string, data: { name?: string; description?: string }): Promise<Project> {
    await delay(300);
    const project = mockProjects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    Object.assign(project, { ...data, updatedAt: new Date() });
    return project;
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    mockProjects = mockProjects.filter((p) => p.id !== id);
    // Move documents to default project
    mockDocuments = mockDocuments.map((d) =>
      d.projectId === id ? { ...d, projectId: "1" } : d
    );
  },

  async getHierarchy(): Promise<Project[]> {
    await delay(200);
    // Build hierarchical structure
    const projectMap = new Map<string, Project>();
    mockProjects.forEach((p) => {
      projectMap.set(p.id, { ...p, children: [] });
    });

    const roots: Project[] = [];
    projectMap.forEach((project) => {
      if (!project.parentId) {
        roots.push(project);
      } else {
        const parent = projectMap.get(project.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(project);
        }
      }
    });

    return roots;
  },
};

// Documents API
export const documentsApi = {
  async list(
    params?: PaginationParams & SortParams & FilterParams
  ): Promise<DocumentListResponse> {
    try {
      // Try to fetch from backend first
      const queryParams = new URLSearchParams();
      if (params?.projectId) {
        queryParams.append("project_id", params.projectId);
      }
      if (params?.status && params.status.length > 0) {
        queryParams.append("status", params.status[0]); // Backend accepts single status for now
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/documents/?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          // Add authentication headers if needed
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Convert backend documents to frontend format
        const documents: Document[] = data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          status: doc.status as "processing" | "ready" | "error",
          uploadedAt: new Date(doc.uploaded_at),
          uploadedBy: doc.uploaded_by,
          size: doc.size,
          type: doc.type,
          projectId: doc.project_id || null,
          tags: doc.tags || [],
          metadata: doc.metadata || {},
        }));

        // Update mock documents for compatibility
        mockDocuments = documents;

        // Apply additional frontend filters (search, tags, etc.)
        let filtered = [...documents];

        // Apply filters
        // Note: projectId and status are already filtered by backend, but we apply additional filters here
        if (params?.fileType && params.fileType.length > 0) {
          filtered = filtered.filter((d) => params.fileType!.includes(d.type));
        }

        if (params?.tags && params.tags.length > 0) {
          filtered = filtered.filter((d) =>
            params.tags!.some((tag) => d.tags.includes(tag))
          );
        }

        if (params?.uploadedBy && params.uploadedBy.length > 0) {
          filtered = filtered.filter((d) => params.uploadedBy!.includes(d.uploadedBy));
        }

        if (params?.dateFrom) {
          filtered = filtered.filter((d) => d.uploadedAt >= params.dateFrom!);
        }

        if (params?.dateTo) {
          filtered = filtered.filter((d) => d.uploadedAt <= params.dateTo!);
        }

        if (params?.search) {
          const searchLower = params.search.toLowerCase();
          filtered = filtered.filter((d) => d.name.toLowerCase().includes(searchLower));
        }

        // Apply sorting
        if (params?.field) {
          filtered.sort((a, b) => {
            let aVal: any = a[params.field as keyof Document];
            let bVal: any = b[params.field as keyof Document];

            if (params.field === "uploadedAt") {
              aVal = new Date(aVal).getTime();
              bVal = new Date(bVal).getTime();
            }

            if (typeof aVal === "string") {
              aVal = aVal.toLowerCase();
              bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return params.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return params.direction === "asc" ? 1 : -1;
            return 0;
          });
        } else {
          // Default sort by uploadedAt desc
          filtered.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
        }

        // Apply pagination
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const start = (page - 1) * limit;
        const end = start + limit;

        return {
          documents: filtered.slice(start, end),
          pagination: {
            page,
            limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
            hasNext: end < filtered.length,
            hasPrev: page > 1,
          },
        };
      }
      // If response is not ok, fall through to mock implementation
    } catch (error) {
      console.error("Failed to fetch documents from backend, using mock data:", error);
      // Fallback to mock implementation
    }
    
    // Fallback to mock implementation
    await delay(300);
    let filtered = [...mockDocuments];

    // Apply filters
    // Only filter by projectId if it's a specific string value
    // null or undefined means show all documents regardless of project
    if (params?.projectId !== undefined && params.projectId !== null) {
      filtered = filtered.filter((d) => d.projectId === params.projectId);
    }

    if (params?.status && params.status.length > 0) {
      filtered = filtered.filter((d) => params.status!.includes(d.status));
    }

    if (params?.fileType && params.fileType.length > 0) {
      filtered = filtered.filter((d) => params.fileType!.includes(d.type));
    }

    if (params?.tags && params.tags.length > 0) {
      filtered = filtered.filter((d) =>
        params.tags!.some((tag) => d.tags.includes(tag))
      );
    }

    if (params?.uploadedBy && params.uploadedBy.length > 0) {
      filtered = filtered.filter((d) => params.uploadedBy!.includes(d.uploadedBy));
    }

    if (params?.dateFrom) {
      filtered = filtered.filter((d) => d.uploadedAt >= params.dateFrom!);
    }

    if (params?.dateTo) {
      filtered = filtered.filter((d) => d.uploadedAt <= params.dateTo!);
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter((d) => d.name.toLowerCase().includes(searchLower));
    }

    // Apply sorting
    if (params?.field) {
      filtered.sort((a, b) => {
        let aVal: any = a[params.field as keyof Document];
        let bVal: any = b[params.field as keyof Document];

        if (params.field === "uploadedAt") {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return params.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return params.direction === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by uploadedAt desc
      filtered.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    }

    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      documents: filtered.slice(start, end),
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
        hasNext: end < filtered.length,
        hasPrev: page > 1,
      },
    };
  },

  async get(id: string): Promise<Document> {
    await delay(200);
    const doc = mockDocuments.find((d) => d.id === id);
    if (!doc) throw new Error("Document not found");
    return doc;
  },

  async upload(
    file: File,
    projectId?: string | null
  ): Promise<Document> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      if (projectId) {
        formData.append("project_id", projectId);
      }

      // Upload to backend
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const uploadResponse = await response.json();
    
      // Create blob URL for the uploaded file (for frontend display)
    const blobUrl = URL.createObjectURL(file);
      documentFileMap.set(uploadResponse.id, blobUrl);
    
      // Convert backend response to frontend Document format
    const newDoc: Document = {
        id: uploadResponse.id,
        name: uploadResponse.name,
        status: uploadResponse.status as "processing" | "ready" | "error",
        uploadedAt: new Date(uploadResponse.uploaded_at),
      uploadedBy: "user1",
        size: uploadResponse.size,
        type: uploadResponse.type,
        projectId: uploadResponse.project_id || null,
      tags: [],
        metadata: uploadResponse.metadata || {},
      securityScan: {
        status: "pending",
      },
      processingStatus: {
        currentStep: "upload",
        progress: 0,
        steps: [],
      },
    };
      
      // Add to mock documents for compatibility (until we fully migrate to backend)
    mockDocuments.push(newDoc);
      
    return newDoc;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },
  
  async getFileUrl(id: string): Promise<string | null> {
    // In a real app, this would be: `/api/v1/documents/${id}/download`
    return documentFileMap.get(id) || null;
  },

  async getSecurityScanStatus(id: string): Promise<SecurityScanResult | null> {
    await delay(200);
    const doc = mockDocuments.find((d) => d.id === id);
    return doc?.securityScan || null;
  },

  async getProcessingStatus(id: string): Promise<ProcessingStatus | null> {
    await delay(200);
    const doc = mockDocuments.find((d) => d.id === id);
    return doc?.processingStatus || null;
  },

  async updateSecurityScanStatus(id: string, scanResult: SecurityScanResult): Promise<void> {
    await delay(200);
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      doc.securityScan = scanResult;
    }
  },

  async updateProcessingStatus(id: string, status: ProcessingStatus): Promise<void> {
    await delay(200);
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      doc.processingStatus = status;
      // Update document status based on processing status
      if (status.progress === 100 && !status.error) {
        doc.status = "ready";
      } else if (status.error && !status.error.recoverable) {
        doc.status = "error";
      } else {
        doc.status = "processing";
      }
    }
  },

  async startSecurityScan(id: string, file: File): Promise<SecurityScanResult> {
    await delay(300);
    const scanResult = await performSecurityScan(file);
    await this.updateSecurityScanStatus(id, scanResult);
    return scanResult;
  },

  async startProcessing(
    id: string,
    fileName: string,
    fileType: string,
    onStatusUpdate?: (status: ProcessingStatus) => void
  ): Promise<ProcessingStatus> {
    await delay(300);
    const processingStatus = await processDocument(id, fileName, fileType, async (status) => {
      await this.updateProcessingStatus(id, status);
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
    });
    await this.updateProcessingStatus(id, processingStatus);
    return processingStatus;
  },

  async retryProcessing(
    id: string,
    fileName: string,
    fileType: string,
    onStatusUpdate?: (status: ProcessingStatus) => void
  ): Promise<ProcessingStatus> {
    await delay(300);
    const processingStatus = await retryProcessing(id, fileName, fileType, async (status) => {
      await this.updateProcessingStatus(id, status);
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
    });
    await this.updateProcessingStatus(id, processingStatus);
    return processingStatus;
  },

  async update(
    id: string,
    data: { name?: string; projectId?: string | null; tags?: string[] }
  ): Promise<Document> {
    await delay(300);
    const doc = mockDocuments.find((d) => d.id === id);
    if (!doc) throw new Error("Document not found");
    Object.assign(doc, data);
    return doc;
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    // Clean up blob URL
    const blobUrl = documentFileMap.get(id);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      documentFileMap.delete(id);
    }
    mockDocuments = mockDocuments.filter((d) => d.id !== id);
  },

  async bulkAction(request: BulkActionRequest): Promise<void> {
    await delay(500);
    request.documentIds.forEach((docId) => {
      const doc = mockDocuments.find((d) => d.id === docId);
      if (!doc) return;

      switch (request.action) {
        case "delete":
          mockDocuments = mockDocuments.filter((d) => d.id !== docId);
          break;
        case "tag":
          if (request.payload?.tags) {
            doc.tags = [...new Set([...doc.tags, ...request.payload.tags])];
          }
          break;
        case "untag":
          if (request.payload?.tags) {
            doc.tags = doc.tags.filter((t) => !request.payload!.tags!.includes(t));
          }
          break;
        case "move":
          if (request.payload?.projectId !== undefined) {
            doc.projectId = request.payload.projectId;
          }
          break;
      }
    });
  },
};

// Tags API
export const tagsApi = {
  async list(): Promise<DocumentTag[]> {
    await delay(200);
    return [...mockTags];
  },

  async create(name: string, color?: string): Promise<DocumentTag> {
    await delay(300);
    const newTag: DocumentTag = {
      id: Date.now().toString(),
      name,
      color: color || "#6b7280",
      createdAt: new Date(),
    };
    mockTags.push(newTag);
    return newTag;
  },

  async delete(id: string): Promise<void> {
    await delay(200);
    mockTags = mockTags.filter((t) => t.id !== id);
    // Remove tag from all documents
    mockDocuments.forEach((d) => {
      d.tags = d.tags.filter((t) => t !== id);
    });
  },
};

// Users API
export const usersApi = {
  async list(): Promise<User[]> {
    await delay(200);
    return [...mockUsers];
  },

  async get(id: string): Promise<User> {
    await delay(200);
    const user = mockUsers.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    return user;
  },
};

// Insights API
export const insightsApi = {
  async getInsights(documentId: string): Promise<DocumentInsights> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/insights`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if needed
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Map backend response to frontend DocumentInsights format
      // Backend returns: { summary: { executiveSummary, keyPoints, generatedAt }, entities: {...}, suggestedQuestions: [...] }
      // Frontend expects: DocumentInsights with same structure
      return {
        summary: {
          executiveSummary: data.summary.executiveSummary,
          keyPoints: data.summary.keyPoints,
          generatedAt: new Date(data.summary.generatedAt),
        },
        entities: {
          organizations: data.entities.organizations || [],
          people: data.entities.people || [],
          dates: data.entities.dates || [],
          monetaryValues: data.entities.monetaryValues || [],
          locations: data.entities.locations || [],
        },
        suggestedQuestions: data.suggestedQuestions || [],
      };
    } catch (error) {
      // Handle network errors (CORS, connection refused, etc.)
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Failed to connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running. ` +
          `If using a different port, set VITE_API_BASE_URL in your .env file.`
        );
      }
      throw error;
    }
  },
};

// Cross-Document Analysis API
export const crossDocumentApi = {
  async query(request: CrossDocumentQueryRequest): Promise<CrossDocumentQueryResponse> {
    try {
      // Import caching functions
      const { getCachedQuery, cacheQuery } = await import("./queryCache");
      const { DEFAULT_QUERY_CONFIG } = await import("@/types/query");
      
      // Use default config for cross-document queries (can be made configurable later)
      const config = { ...DEFAULT_QUERY_CONFIG, top_k: 10 };
      
      // Check cache first
      const cachedResponse = getCachedQuery(
        request.query,
        request.documentIds,
        DEFAULT_COLLECTION_NAME,
        config
      );
      
      let response;
      if (cachedResponse) {
        response = cachedResponse;
      } else {
        // Use the real query API endpoint with multiple document_ids
        const queryRequest: QueryRequest = {
          query: request.query,
          collection_name: DEFAULT_COLLECTION_NAME,
          document_ids: request.documentIds, // Multiple documents for cross-doc analysis
          generate_insights: false, // We'll get patterns/contradictions from the response
          search_type: config.search_type,
          top_k: config.top_k,
          rerank_enabled: config.rerank_enabled,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
        };

        response = await queryApi.query(queryRequest);
        
        // Cache the response
        cacheQuery(
          request.query,
          request.documentIds,
          DEFAULT_COLLECTION_NAME,
          config,
          response
        );
      }

      // Get document names for citation mapping
      const docNameMap = new Map<string, string>();
      for (const docId of request.documentIds) {
        try {
          const doc = await documentsApi.get(docId);
          docNameMap.set(docId, doc.name);
        } catch {
          docNameMap.set(docId, docId);
        }
      }

      // Map backend citations to CrossDocumentCitation format
      const citations: CrossDocumentCitation[] = response.citations.map((c) => {
        const docName = docNameMap.get(c.document_id) || c.document_id;
        return {
          documentId: c.document_id,
          documentName: docName,
          text: c.metadata?.text || `Chunk ${c.chunk_id}`,
          page: c.page,
          section: c.metadata?.section,
          relevanceScore: c.score,
        };
      });

      // Map patterns from backend response (if available)
      const patterns = response.patterns && response.patterns.length > 0
        ? response.patterns.map((p: any) => ({
            type: p.type as "theme" | "entity" | "trend" | "relationship",
            description: p.description,
            documents: p.documents || [],
            occurrences: p.occurrences || 0,
            examples: (p.examples || []).map((ex: any) => ({
              documentId: ex.document_id,
              documentName: ex.document_name,
              text: ex.text,
              page: ex.page,
            })),
            confidence: p.confidence || 0.7,
          }))
        : undefined;

      // Map contradictions from backend response (if available)
      const contradictions = response.contradictions && response.contradictions.length > 0
        ? response.contradictions.map((c: any) => ({
            type: c.type as "factual" | "temporal" | "quantitative" | "categorical",
            description: c.description,
            documents: (c.documents || []).map((d: any) => ({
              id: d.id,
              name: d.name,
              claim: d.claim,
              page: d.page,
              section: d.section,
            })),
            severity: c.severity as "low" | "medium" | "high",
            confidence: c.confidence || 0.7,
          }))
        : undefined;

      return {
        answer: response.answer,
        citations,
        patterns: (request.includePatterns && patterns && patterns.length > 0) ? patterns : undefined,
        contradictions: (request.includeContradictions && contradictions && contradictions.length > 0) ? contradictions : undefined,
        generatedAt: new Date(response.generated_at),
      };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Failed to connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running.`
        );
      }
      throw error;
    }
  },

  async compare(documentIds: string[]): Promise<DocumentComparison> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(documentIds),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Map backend response to frontend format
      return {
        documentIds: data.documentIds,
        similarities: data.similarities.map((s: any) => ({
          aspect: s.aspect,
          description: s.description,
          documents: s.documents,
          examples: s.examples.map((ex: any) => ({
            documentId: ex.documentId,
            documentName: ex.documentName,
            text: ex.text,
            page: ex.page,
          })),
        })),
        differences: data.differences.map((d: any) => ({
          aspect: d.aspect,
          description: d.description,
          documents: d.documents.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            value: doc.value,
            page: doc.page,
          })),
        })),
        generatedAt: new Date(data.generatedAt),
      };
    } catch (error) {
      console.error("Failed to compare documents:", error);
      throw error;
    }
  },
};

// Sharing API
let mockShareLinks: ShareLink[] = [];
let mockComments: Comment[] = [];
let mockAnnotations: Annotation[] = [];
let mockAnalysisShareLinks: AnalysisShareLink[] = [];

export const sharingApi = {
  async createShareLink(request: CreateShareLinkRequest): Promise<ShareLink> {
    await delay(400);
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    
    const shareLink: ShareLink = {
      id: Date.now().toString(),
      documentId: request.documentId,
      shareToken,
      shareUrl,
      permission: request.permission,
      access: request.access,
      allowedUsers: request.allowedUsers,
      expiresAt: request.expiresAt,
      createdAt: new Date(),
      createdBy: "user1",
      isActive: true,
    };
    
    mockShareLinks.push(shareLink);
    return shareLink;
  },

  async getShareLinks(documentId: string): Promise<ShareLink[]> {
    await delay(200);
    return mockShareLinks.filter((link) => link.documentId === documentId && link.isActive);
  },

  async updateShareLink(id: string, request: UpdateShareLinkRequest): Promise<ShareLink> {
    await delay(300);
    const link = mockShareLinks.find((l) => l.id === id);
    if (!link) throw new Error("Share link not found");
    
    Object.assign(link, { ...request, updatedAt: new Date() });
    return link;
  },

  async revokeShareLink(id: string): Promise<void> {
    await delay(200);
    const link = mockShareLinks.find((l) => l.id === id);
    if (link) {
      link.isActive = false;
    }
  },

  async getSharedDocument(shareToken: string): Promise<{ document: Document; shareLink: ShareLink }> {
    await delay(300);
    const shareLink = mockShareLinks.find((l) => l.shareToken === shareToken && l.isActive);
    if (!shareLink) throw new Error("Share link not found or expired");
    
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new Error("Share link has expired");
    }
    
    const document = mockDocuments.find((d) => d.id === shareLink.documentId);
    if (!document) throw new Error("Document not found");
    
    return { document, shareLink };
  },
};

// Comments API
export const commentsApi = {
  async getComments(documentId: string, page?: number): Promise<Comment[]> {
    await delay(200);
    let filtered = mockComments.filter((c) => c.documentId === documentId);
    
    if (page !== undefined) {
      filtered = filtered.filter((c) => c.page === page);
    }
    
    // Attach user info
    return filtered.map((comment) => ({
      ...comment,
      createdByUser: mockUsers.find((u) => u.id === comment.createdBy),
      replies: mockComments
        .filter((c) => c.parentId === comment.id)
        .map((reply) => ({
          ...reply,
          createdByUser: mockUsers.find((u) => u.id === reply.createdBy),
        })),
    }));
  },

  async createComment(request: CreateCommentRequest): Promise<Comment> {
    await delay(300);
    const comment: Comment = {
      id: Date.now().toString(),
      documentId: request.documentId,
      content: request.content,
      page: request.page,
      x: request.x,
      y: request.y,
      parentId: request.parentId,
      createdBy: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      createdByUser: mockUsers.find((u) => u.id === "user1"),
    };
    
    mockComments.push(comment);
    return comment;
  },

  async updateComment(id: string, request: UpdateCommentRequest): Promise<Comment> {
    await delay(300);
    const comment = mockComments.find((c) => c.id === id);
    if (!comment) throw new Error("Comment not found");
    
    Object.assign(comment, { ...request, updatedAt: new Date() });
    comment.createdByUser = mockUsers.find((u) => u.id === comment.createdBy);
    return comment;
  },

  async deleteComment(id: string): Promise<void> {
    await delay(200);
    // Also delete replies
    mockComments = mockComments.filter((c) => c.id !== id && c.parentId !== id);
  },
};

// Annotations API
export const annotationsApi = {
  async getAnnotations(documentId: string, page?: number): Promise<Annotation[]> {
    await delay(200);
    let filtered = mockAnnotations.filter((a) => a.documentId === documentId);
    
    if (page !== undefined) {
      filtered = filtered.filter((a) => a.page === page);
    }
    
    return filtered;
  },

  async createAnnotation(request: CreateAnnotationRequest): Promise<Annotation> {
    await delay(300);
    const annotation: Annotation = {
      id: Date.now().toString(),
      documentId: request.documentId,
      type: request.type,
      page: request.page,
      x: request.x,
      y: request.y,
      width: request.width,
      height: request.height,
      color: request.color || "#fbbf24",
      content: request.content,
      createdBy: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockAnnotations.push(annotation);
    return annotation;
  },

  async updateAnnotation(id: string, data: Partial<Annotation>): Promise<Annotation> {
    await delay(300);
    const annotation = mockAnnotations.find((a) => a.id === id);
    if (!annotation) throw new Error("Annotation not found");
    
    Object.assign(annotation, { ...data, updatedAt: new Date() });
    return annotation;
  },

  async deleteAnnotation(id: string): Promise<void> {
    await delay(200);
    mockAnnotations = mockAnnotations.filter((a) => a.id !== id);
  },
};

// Export API
export const exportApi = {
  async exportChatHistory(documentId: string, messages: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>, format: ExportFormat = "txt"): Promise<Blob> {
    await delay(500);
    
    let content = "";
    if (format === "txt" || format === "json") {
      if (format === "json") {
        content = JSON.stringify(messages, null, 2);
      } else {
        content = messages.map((msg) => {
          const timestamp = new Date(msg.timestamp).toLocaleString();
          return `[${timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`;
        }).join("\n\n");
      }
    }
    
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain" });
    return blob;
  },

  async exportSummary(documentId: string, summary: DocumentInsights["summary"], format: ExportFormat = "txt"): Promise<Blob> {
    await delay(500);
    
    let content = "";
    if (format === "txt" || format === "json") {
      if (format === "json") {
        content = JSON.stringify(summary, null, 2);
      } else {
        content = `EXECUTIVE SUMMARY\n${"=".repeat(50)}\n\n${summary.executiveSummary}\n\n\nKEY POINTS\n${"=".repeat(50)}\n\n${summary.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n")}\n\n\nGenerated at: ${new Date(summary.generatedAt).toLocaleString()}`;
      }
    }
    
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain" });
    return blob;
  },

  async exportToPDF(documentId: string, content: string): Promise<Blob> {
    await delay(800);
    // In a real implementation, this would use a PDF generation library
    // For now, we'll create a simple text blob that can be converted to PDF
    const blob = new Blob([content], { type: "application/pdf" });
    return blob;
  },

  async exportToWord(documentId: string, content: string): Promise<Blob> {
    await delay(800);
    // In a real implementation, this would use a DOCX generation library
    const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    return blob;
  },

  async exportToExcel(documentId: string, data: any[][]): Promise<Blob> {
    await delay(800);
    // In a real implementation, this would use an XLSX generation library
    const blob = new Blob([JSON.stringify(data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    return blob;
  },
};

// Analysis Share Link API
export const analysisShareApi = {
  async createAnalysisShareLink(documentId: string, includesChatHistory: boolean, includesSummary: boolean, expiresAt?: Date): Promise<AnalysisShareLink> {
    await delay(400);
    const shareToken = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `${window.location.origin}/analysis/${shareToken}`;
    
    const shareLink: AnalysisShareLink = {
      id: Date.now().toString(),
      documentId,
      shareToken,
      shareUrl,
      includesChatHistory,
      includesSummary,
      expiresAt,
      createdAt: new Date(),
      createdBy: "user1",
      isActive: true,
    };
    
    mockAnalysisShareLinks.push(shareLink);
    return shareLink;
  },

  async getAnalysisShareLink(shareToken: string): Promise<AnalysisShareLink> {
    await delay(200);
    const shareLink = mockAnalysisShareLinks.find((l) => l.shareToken === shareToken && l.isActive);
    if (!shareLink) throw new Error("Analysis share link not found");
    
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new Error("Analysis share link has expired");
    }
    
    return shareLink;
  },

  async revokeAnalysisShareLink(id: string): Promise<void> {
    await delay(200);
    const link = mockAnalysisShareLinks.find((l) => l.id === id);
    if (link) {
      link.isActive = false;
    }
  },
};

// User Profile API
export const userProfileApi = {
  async getProfile(): Promise<UserProfile> {
    await delay(300);
    return { ...mockUserProfile };
  },

  async updateProfile(data: UpdateUserProfileRequest): Promise<UserProfile> {
    await delay(400);
    mockUserProfile = {
      ...mockUserProfile,
      ...data,
      updatedAt: new Date(),
    };
    return { ...mockUserProfile };
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    await delay(500);
    // In a real app, this would upload to a storage service and return the URL
    const avatarUrl = URL.createObjectURL(file);
    mockUserProfile = {
      ...mockUserProfile,
      avatar: avatarUrl,
      updatedAt: new Date(),
    };
    return { avatarUrl };
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await delay(400);
    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      throw new Error("New passwords do not match");
    }
    // In a real app, this would validate current password and update it
    // For mock, we just simulate success
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    await delay(200);
    return { ...mockNotificationPreferences };
  },

  async updateNotificationPreferences(
    data: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences> {
    await delay(300);
    if (data.emailNotifications) {
      mockNotificationPreferences.emailNotifications = {
        ...mockNotificationPreferences.emailNotifications,
        ...data.emailNotifications,
      };
    }
    if (data.inAppNotifications) {
      mockNotificationPreferences.inAppNotifications = {
        ...mockNotificationPreferences.inAppNotifications,
        ...data.inAppNotifications,
      };
    }
    if (data.pushNotifications) {
      mockNotificationPreferences.pushNotifications = {
        ...mockNotificationPreferences.pushNotifications,
        ...data.pushNotifications,
      };
    }
    return { ...mockNotificationPreferences };
  },
};

// Query API - RAG Pipeline Integration
export const queryApi = {
  /**
   * Query documents using RAG pipeline
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/query/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if needed
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // Handle network errors (CORS, connection refused, etc.)
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Failed to connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running. ` +
          `If using a different port, set VITE_API_BASE_URL in your .env file.`
        );
      }
      throw error;
    }
  },

  /**
   * Stream query response using Server-Sent Events
   */
  async queryStream(
    request: QueryRequest,
    onChunk: (chunk: string) => void,
    onComplete?: (answerLength: number) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/query/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authentication headers if needed
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Streaming query failed" }));
      onError?.(new Error(error.detail || `HTTP ${response.status}`));
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError?.(new Error("No response body"));
      return;
    }

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              onChunk(data.chunk);
            }
            if (data.done) {
              onComplete?.(data.answer_length || 0);
              return;
            }
          } catch (e) {
            console.error("Failed to parse SSE data:", e);
          }
        }
      }
    }
  },

  /**
   * Get query history
   */
  async getHistory(): Promise<QueryHistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/query/history`, {
      method: "GET",
      headers: {
        // Add authentication headers if needed
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },
};

// Tasks API - Processing Status Integration
export const tasksApi = {
  /**
   * Get task status from backend
   */
  async getTaskStatus(taskId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
      method: "GET",
      headers: {
        // Add authentication headers if needed
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return null to indicate task not found
        // The caller should check document status as fallback
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * List all tasks with optional filtering
   */
  async listTasks(taskType?: string, taskStatus?: string): Promise<{ tasks: any[]; count: number }> {
    const params = new URLSearchParams();
    if (taskType) params.append("task_type", taskType);
    if (taskStatus) params.append("task_status", taskStatus);

    const response = await fetch(`${API_BASE_URL}/api/v1/tasks?${params.toString()}`, {
      method: "GET",
      headers: {
        // Add authentication headers if needed
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },
};

