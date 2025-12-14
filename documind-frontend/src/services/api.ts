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
} from "@/types/api";
import { performSecurityScan } from "./securityScanService";
import { processDocument, retryProcessing } from "./processingQueueService";

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
    await delay(500);
    const docId = Date.now().toString();
    
    // Create blob URL for the uploaded file
    const blobUrl = URL.createObjectURL(file);
    documentFileMap.set(docId, blobUrl);
    
    const newDoc: Document = {
      id: docId,
      name: file.name,
      status: "processing", // Start as processing to trigger security scan and processing
      uploadedAt: new Date(),
      uploadedBy: "user1",
      size: file.size,
      type: file.name.split(".").pop()?.toLowerCase() || "",
      projectId: projectId || null,
      tags: [],
      metadata: {
        pageCount: file.type === "application/pdf" ? 10 : undefined, // Mock page count for PDFs
      },
      securityScan: {
        status: "pending",
      },
      processingStatus: {
        currentStep: "upload",
        progress: 0,
        steps: [],
      },
    };
    mockDocuments.push(newDoc);
    return newDoc;
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
    await delay(800); // Simulate API call delay
    
    // Mock insights data - in production, this would be a real API call
    // GET /api/v1/documents/{document_id}/insights
    const mockInsights: DocumentInsights = {
      summary: {
        executiveSummary: `This document provides a comprehensive overview of the key topics and findings. The content covers multiple important areas including strategic planning, operational considerations, and future outlook. Key themes emerge around innovation, efficiency, and growth opportunities. The document presents detailed analysis and recommendations that are critical for decision-making processes.`,
        keyPoints: [
          "Strategic initiatives focus on digital transformation and market expansion",
          "Operational efficiency improvements target cost reduction of 15-20%",
          "Key partnerships and collaborations are identified as growth drivers",
          "Risk management strategies address emerging market challenges",
          "Technology investments prioritize scalability and innovation",
        ],
        generatedAt: new Date(),
      },
      entities: {
        organizations: [
          { text: "Acme Corporation", context: "Primary partner organization", page: 1, count: 5 },
          { text: "Tech Solutions Inc.", context: "Technology vendor", page: 3, count: 3 },
          { text: "Global Industries Ltd.", context: "Strategic alliance partner", page: 5, count: 2 },
        ],
        people: [
          { text: "John Smith", context: "Chief Executive Officer", page: 2, count: 4 },
          { text: "Sarah Johnson", context: "Director of Operations", page: 4, count: 3 },
          { text: "Michael Chen", context: "Head of Technology", page: 6, count: 2 },
        ],
        dates: [
          { text: "Q1 2024", context: "Project launch timeline", page: 1, count: 2 },
          { text: "December 2024", context: "Target completion date", page: 3, count: 1 },
          { text: "2025-2027", context: "Long-term strategic period", page: 5, count: 1 },
        ],
        monetaryValues: [
          { text: "$2.5 million", value: 2500000, currency: "USD", formatted: "$2,500,000", context: "Initial investment", page: 2, count: 1 },
          { text: "$500,000", value: 500000, currency: "USD", formatted: "$500,000", context: "Annual budget allocation", page: 4, count: 1 },
          { text: "$1.2 million", value: 1200000, currency: "USD", formatted: "$1,200,000", context: "Expected revenue", page: 6, count: 1 },
        ],
        locations: [
          { text: "New York", context: "Headquarters location", page: 1, count: 2 },
          { text: "San Francisco", context: "Regional office", page: 3, count: 1 },
        ],
      },
      suggestedQuestions: [
        "What are the main strategic objectives outlined in this document?",
        "What are the key financial figures and budget allocations?",
        "Who are the primary stakeholders and decision-makers mentioned?",
        "What are the major risks and how are they being addressed?",
        "What is the timeline for implementation of key initiatives?",
        "What partnerships or collaborations are discussed?",
        "What technology investments are planned?",
        "What are the expected outcomes and success metrics?",
      ],
    };

    return mockInsights;
  },
};

// Cross-Document Analysis API
export const crossDocumentApi = {
  async query(request: CrossDocumentQueryRequest): Promise<CrossDocumentQueryResponse> {
    await delay(1500); // Simulate API call delay
    
    // Mock cross-document query response
    // In production: POST /api/v1/query/cross-document
    const docNames = request.documentIds
      .map((id) => mockDocuments.find((d) => d.id === id)?.name || id)
      .join(", ");

    const mockResponse: CrossDocumentQueryResponse = {
      answer: `Based on my analysis of ${request.documentIds.length} document(s) (${docNames}), I found relevant information regarding your query: "${request.query}".\n\nThe documents collectively address this topic across multiple sections. Key insights include:\n\n1. Common themes and patterns emerge across the selected documents\n2. Different perspectives and approaches are presented\n3. Complementary information provides a comprehensive view\n\nI've identified specific passages from each document that relate to your question and cited them below.`,
      citations: request.documentIds.map((docId, index) => {
        const doc = mockDocuments.find((d) => d.id === docId);
        return {
          documentId: docId,
          documentName: doc?.name || `Document ${index + 1}`,
          text: `Relevant passage from ${doc?.name || "document"} addressing the query`,
          page: (index + 1) * 3,
          section: `Section ${index + 1}.${index + 2}`,
          relevanceScore: 0.85 - index * 0.1,
        };
      }),
      patterns: request.includePatterns
        ? [
            {
              type: "theme" as const,
              description: "Common strategic themes across documents",
              documents: request.documentIds,
              occurrences: 5,
              examples: request.documentIds.slice(0, 2).map((docId) => {
                const doc = mockDocuments.find((d) => d.id === docId);
                return {
                  documentId: docId,
                  documentName: doc?.name || "Document",
                  text: "Example of strategic theme",
                  page: 2,
                };
              }),
              confidence: 0.8,
            },
            {
              type: "entity" as const,
              description: "Shared entities and organizations mentioned",
              documents: request.documentIds,
              occurrences: 3,
              examples: request.documentIds.slice(0, 2).map((docId) => {
                const doc = mockDocuments.find((d) => d.id === docId);
                return {
                  documentId: docId,
                  documentName: doc?.name || "Document",
                  text: "Example entity reference",
                  page: 4,
                };
              }),
              confidence: 0.75,
            },
          ]
        : undefined,
      contradictions: request.includeContradictions
        ? [
            {
              type: "factual" as const,
              description: "Different factual claims about the same topic",
              documents: [
                {
                  id: request.documentIds[0],
                  name: mockDocuments.find((d) => d.id === request.documentIds[0])?.name || "Document 1",
                  claim: "Claim A from first document",
                  page: 5,
                },
                {
                  id: request.documentIds[1] || request.documentIds[0],
                  name: mockDocuments.find((d) => d.id === request.documentIds[1])?.name || "Document 2",
                  claim: "Contradictory claim B from second document",
                  page: 7,
                },
              ],
              severity: "medium" as const,
              confidence: 0.7,
            },
          ]
        : undefined,
      generatedAt: new Date(),
    };

    return mockResponse;
  },

  async compare(documentIds: string[]): Promise<DocumentComparison> {
    await delay(1200); // Simulate API call delay
    
    // Mock document comparison
    // In production: POST /api/v1/documents/compare
    const docs = documentIds.map((id) => mockDocuments.find((d) => d.id === id)).filter(Boolean) as Document[];

    const mockComparison: DocumentComparison = {
      documentIds,
      similarities: [
        {
          aspect: "Strategic Focus",
          description: "Both documents emphasize digital transformation and innovation as core strategic priorities",
          documents: documentIds,
          examples: docs.slice(0, 2).map((doc, idx) => ({
            documentId: doc.id,
            documentName: doc.name,
            text: "Example text about strategic focus",
            page: idx + 1,
          })),
        },
        {
          aspect: "Key Stakeholders",
          description: "Similar organizational structures and key personnel mentioned across documents",
          documents: documentIds,
          examples: docs.slice(0, 2).map((doc, idx) => ({
            documentId: doc.id,
            documentName: doc.name,
            text: "Example stakeholder reference",
            page: idx + 2,
          })),
        },
      ],
      differences: [
        {
          aspect: "Timeline",
          description: "Different project timelines and deadlines",
          documents: docs.map((doc, idx) => ({
            id: doc.id,
            name: doc.name,
            value: `Q${idx + 1} 2024 - Q${idx + 2} 2025`,
            page: idx + 3,
          })),
        },
        {
          aspect: "Budget Allocation",
          description: "Varying budget figures and allocation strategies",
          documents: docs.map((doc, idx) => ({
            id: doc.id,
            name: doc.name,
            value: `$${(idx + 1) * 500}K`,
            page: idx + 4,
          })),
        },
      ],
      generatedAt: new Date(),
    };

    return mockComparison;
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

