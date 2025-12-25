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
  Organization,
  OrganizationMember,
  OrganizationMemberList,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  OrganizationSettings,
  UpdateOrganizationSettingsRequest,
  Activity,
  ActivityListResponse,
  ActivityFilterParams,
  DocumentMetricsResponse,
  StorageMetricsResponse,
} from "@/types/api";
import type { SavedCrossDocumentAnalysis } from "@/utils/crossDocumentStorage";
import { performSecurityScan } from "./securityScanService";
import { processDocument, retryProcessing } from "./processingQueueService";
import { API_BASE_URL, DEFAULT_COLLECTION_NAME } from "@/config/api";
import { tokenStorage } from "./authService";
import { apiClient } from "./apiClient";

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Mock data storage (in a real app, this would be API calls)
let mockProjects: Project[] = [];

let mockDocuments: Document[] = [];
// Store file blobs/URLs for mock documents
const documentFileMap = new Map<string, string>(); // documentId -> blob URL
// Track locally deleted documents to filter them out even if backend still returns them
const locallyDeletedDocuments = new Set<string>();
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
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const data = await apiClient.get<any>(`/api/v1/projects/?${queryParams.toString()}`, {
        headers: {
          "Cache-Control": "no-cache",
        },
        cache: "no-store", // Prevent browser caching
      });
      
      // Convert backend projects to frontend format
      const projects: Project[] = data.projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        parentId: p.parent_id || null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        documentCount: p.document_count || 0,
        isFavorite: p.is_favorite || false,
        children: [],
      }));

      // Update mock projects for compatibility
      mockProjects = projects;

      return {
        projects,
        pagination: data.pagination,
      };
    } catch (error) {
      console.error("Failed to fetch projects from backend, using mock data:", error);
      // Fallback to mock data
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
    }
  },

  async get(id: string): Promise<Project> {
    try {
      const p = await apiClient.get<any>(`/api/v1/projects/${id}`);
      
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        parentId: p.parent_id || null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        documentCount: p.document_count || 0,
        children: [],
      };
    } catch (error) {
      console.error("Failed to fetch project from backend, using mock data:", error);
      // Fallback to mock data
      await delay(200);
      const project = mockProjects.find((p) => p.id === id);
      if (!project) throw new Error("Project not found");
      return project;
    }
  },

  async create(data: { name: string; description?: string; parentId?: string | null }): Promise<Project> {
    try {
      const p = await apiClient.post<any>("/api/v1/projects/", {
        name: data.name,
        description: data.description,
        parent_id: data.parentId || null,
      });
      
      const newProject: Project = {
        id: p.id,
        name: p.name,
        description: p.description,
        parentId: p.parent_id || null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        documentCount: p.document_count || 0,
        children: [],
      };

      // Update mock projects for compatibility
      mockProjects.push(newProject);

      return newProject;
    } catch (error) {
      console.error("Failed to create project in backend, using mock data:", error);
      // Fallback to mock data
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
    }
  },

  async update(id: string, data: { name?: string; description?: string; parentId?: string | null }): Promise<Project> {
    try {
      const body: any = {
        name: data.name,
        description: data.description,
      };
      
      // Always include parent_id if parentId is provided (even if null)
      if (data.parentId !== undefined) {
        body.parent_id = data.parentId;
      }
      
      const p = await apiClient.put<any>(`/api/v1/projects/${id}`, body, {
        headers: {
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });
      
      const updatedProject: Project = {
        id: p.id,
        name: p.name,
        description: p.description,
        parentId: p.parent_id || null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        documentCount: p.document_count || 0,
        children: [],
      };

      // Update mock projects for compatibility
      const index = mockProjects.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockProjects[index] = updatedProject;
      }

      return updatedProject;
    } catch (error) {
      console.error("Failed to update project in backend, using mock data:", error);
      // Fallback to mock data
      await delay(300);
      const project = mockProjects.find((p) => p.id === id);
      if (!project) throw new Error("Project not found");
      Object.assign(project, { ...data, updatedAt: new Date() });
      return project;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/projects/${id}`);

      // Remove from mock projects for compatibility
      mockProjects = mockProjects.filter((p) => p.id !== id);
      // Remove project association from documents (set to null)
      mockDocuments = mockDocuments.map((d) =>
        d.projectId === id ? { ...d, projectId: null } : d
      );
    } catch (error) {
      console.error("Failed to delete project in backend, using mock data:", error);
      // Fallback to mock data
      await delay(300);
      mockProjects = mockProjects.filter((p) => p.id !== id);
      // Remove project association from documents (set to null)
      mockDocuments = mockDocuments.map((d) =>
        d.projectId === id ? { ...d, projectId: null } : d
      );
    }
  },

  async getHierarchy(): Promise<Project[]> {
    try {
      const projects = await apiClient.get<any[]>("/api/v1/projects/hierarchy", {
        headers: {
          "Cache-Control": "no-cache",
        },
        cache: "no-store", // Prevent browser caching
      });
      
      // Convert backend projects to frontend format recursively
      const convertProject = (p: any): Project => ({
        id: p.id,
        name: p.name,
        description: p.description,
        parentId: p.parent_id || null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        documentCount: p.document_count || 0,
        isFavorite: p.is_favorite || false,
        children: p.children ? p.children.map(convertProject) : [],
      });

      const convertedProjects = projects.map(convertProject);
      
      // Update mock projects for compatibility (in case other parts use it)
      const flattenProjects = (projs: Project[]): Project[] => {
        const result: Project[] = [];
        projs.forEach((p) => {
          result.push(p);
          if (p.children && p.children.length > 0) {
            result.push(...flattenProjects(p.children));
          }
        });
        return result;
      };
      mockProjects = flattenProjects(convertedProjects);

      return convertedProjects;
    } catch (error) {
      console.error("Failed to fetch project hierarchy from backend:", error);
      // Don't silently fall back to mock data - throw the error so the UI can handle it
      throw error;
    }
  },

  async getFavorites(params?: PaginationParams): Promise<ProjectListResponse> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const data = await apiClient.get<any>(`/api/v1/projects/favorites?${queryParams.toString()}`, {
        headers: {
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });
      
      // Convert backend projects to frontend format
      const projects: Project[] = data.projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        parentId: p.parent_id || null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        documentCount: p.document_count || 0,
        isFavorite: p.is_favorite || true, // All projects in favorites list are favorites
        children: [],
      }));

      return {
        projects,
        pagination: data.pagination,
      };
    } catch (error) {
      console.error("Failed to fetch favorite projects:", error);
      throw error;
    }
  },

  async toggleFavorite(projectId: string): Promise<Project> {
    try {
      const p = await apiClient.post<any>(`/api/v1/projects/${projectId}/favorite`, {});
      
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        parentId: p.parent_id || null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        documentCount: p.document_count || 0,
        isFavorite: p.is_favorite || false,
        children: [],
      };
    } catch (error) {
      console.error("Failed to toggle project favorite:", error);
      throw error;
    }
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
          ...getAuthHeaders(),
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
        // Filter out locally deleted documents even if backend still returns them
        let filtered = documents.filter((d) => !locallyDeletedDocuments.has(d.id));

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

  async listRecent(limit: number = 10): Promise<DocumentListResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/recent?limit=${limit}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const documents: Document[] = (data.documents || []).map((doc: any) => ({
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

      return {
        documents,
        pagination: {
          page: 1,
          limit,
          total: data.total || documents.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Failed to connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running.`
        );
      }
      throw error;
    }
  },

  async getHealth(): Promise<{
    totalDocuments: number;
    errorCount: number;
    stuckCount: number;
    storageWarning: boolean;
    storagePercentage: number;
    errors: Array<{ id: string; name: string; status: string; uploaded_at: string }>;
    stuck: Array<{ id: string; name: string; status: string; uploaded_at: string; hours_stuck: number }>;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/health`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Failed to connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running.`
        );
      }
      throw error;
    }
  },

  async get(id: string): Promise<Document> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const doc = await response.json();
        // Convert backend document to frontend format
        const document: Document = {
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
        };

        // Update mock documents for compatibility
        const index = mockDocuments.findIndex((d) => d.id === id);
        if (index !== -1) {
          mockDocuments[index] = document;
        } else {
          mockDocuments.push(document);
        }

        return document;
      }
      // If response is not ok, fall through to mock implementation
    } catch (error) {
      console.error("Failed to fetch document from backend, using mock data:", error);
      // Fallback to mock implementation
    }

    // Fallback to mock implementation
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
      const authHeaders = getAuthHeaders();
      // Remove Content-Type from auth headers for FormData (browser will set it with boundary)
      delete authHeaders["Content-Type"];
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
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
    try {
      // Fetch the PDF with auth headers and create a blob URL
      // This is necessary because iframes can't send Authorization headers
      const url = `${API_BASE_URL}/api/v1/documents/${id}/download`;
      console.log("Fetching document file URL:", url, "for document ID:", id);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(error.detail || `Failed to fetch document: HTTP ${response.status}`);
      }

      // Get the file as a blob
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);
      
      // Store the blob URL in the map for cleanup later
      documentFileMap.set(id, blobUrl);
      
      console.log("Created blob URL for document:", id, blobUrl);
      return blobUrl;
    } catch (error) {
      console.error("Failed to get document file URL:", error);
      // Fallback to mock blob URL if available
    return documentFileMap.get(id) || null;
    }
  },

  async getSecurityScanStatus(id: string): Promise<SecurityScanResult | null> {
    await delay(200);
    const doc = mockDocuments.find((d) => d.id === id);
    return doc?.securityScan || null;
  },

  async getStatus(id: string): Promise<{
    document_id: string;
    status: string;
    current_step: string | null;
    progress: number;
    steps: Array<{
      step: string;
      status: string;
      started_at: string | null;
      completed_at: string | null;
      error: string | null;
    }>;
    queue_position: number | null;
    error_message: string | null;
    updated_at: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/status`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get document status:", error);
      throw error;
    }
  },

  async reindex(id: string, force: boolean = false): Promise<{
    document_id: string;
    message: string;
    status: string;
    started_at: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/reindex`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ force }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to reindex document:", error);
      throw error;
    }
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
    try {
      // Handle tag updates separately using the tag assignment endpoints
      if (data.tags !== undefined) {
        // Get current document to compare tags
        const currentDoc = await this.get(id);
        const currentTags = new Set(currentDoc.tags);
        const newTags = new Set(data.tags);
        
        // Find tags to add and remove
        const tagsToAdd = Array.from(newTags).filter(tagId => !currentTags.has(tagId));
        const tagsToRemove = Array.from(currentTags).filter(tagId => !newTags.has(tagId));
        
        // Add tags
        if (tagsToAdd.length > 0) {
          try {
            const addResponse = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/tags`, {
              method: "POST",
              headers: {
                ...getAuthHeaders(),
              },
              body: JSON.stringify({ tag_ids: tagsToAdd }),
            });
            
            if (!addResponse.ok) {
              throw new Error("Failed to add tags");
            }
          } catch (error) {
            console.error("Failed to add tags via backend:", error);
            // Fall through to mock implementation
          }
        }
        
        // Remove tags
        for (const tagId of tagsToRemove) {
          try {
            const removeResponse = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/tags/${tagId}`, {
              method: "DELETE",
              headers: {
                ...getAuthHeaders(),
              },
            });
            
            if (!removeResponse.ok) {
              console.warn(`Failed to remove tag ${tagId} via backend`);
            }
          } catch (error) {
            console.error(`Failed to remove tag ${tagId} via backend:`, error);
            // Continue with other removals
          }
        }
        
        // Reload document to get updated tags
        const updatedDoc = await this.get(id);
        return updatedDoc;
      }
      
      // Update document (name, projectId) via backend
      const body: any = {};
      if (data.name !== undefined) {
        body.name = data.name;
      }
      if (data.projectId !== undefined) {
        body.project_id = data.projectId;
      }
      
      const updateResponse = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      
      if (!updateResponse.ok) {
        const error = await updateResponse.json().catch(() => ({ detail: "Failed to update document" }));
        throw new Error(error.detail || `HTTP ${updateResponse.status}`);
      }
      
      const updatedDoc = await updateResponse.json();
      
      return {
        id: updatedDoc.id,
        name: updatedDoc.name,
        status: updatedDoc.status,
        uploadedAt: new Date(updatedDoc.uploaded_at),
        uploadedBy: updatedDoc.uploaded_by,
        size: updatedDoc.size,
        type: updatedDoc.type,
        projectId: updatedDoc.project_id || null,
        tags: updatedDoc.tags || [],
        metadata: updatedDoc.metadata || {},
      };
    } catch (error) {
      console.error("Failed to update document via backend, using mock:", error);
      // Fallback to mock implementation
    await delay(300);
    const doc = mockDocuments.find((d) => d.id === id);
    if (!doc) throw new Error("Document not found");
    Object.assign(doc, data);
    return doc;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Try to delete from backend first
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      // Clean up blob URL
      const blobUrl = documentFileMap.get(id);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        documentFileMap.delete(id);
      }
      
      if (response.ok) {
        // Backend deletion successful
        // Update local mock documents
        mockDocuments = mockDocuments.filter((d) => d.id !== id);
        // Remove from locally deleted set since backend confirmed deletion
        locallyDeletedDocuments.delete(id);
      } else {
        // If backend deletion fails, mark as locally deleted
        // This ensures it won't reappear when we reload
        locallyDeletedDocuments.add(id);
        // Update local mock documents
        mockDocuments = mockDocuments.filter((d) => d.id !== id);
        console.warn("Backend delete failed, marking as locally deleted");
      }
    } catch (error) {
      // If backend is not available, mark as locally deleted
      locallyDeletedDocuments.add(id);
      // Update local mock documents
      mockDocuments = mockDocuments.filter((d) => d.id !== id);
      console.warn("Backend delete failed, marking as locally deleted:", error);
    }
  },

  async bulkAction(request: BulkActionRequest): Promise<void> {
    try {
      // Handle tag operations via backend
      if (request.action === "tag" && request.payload?.tags) {
        // Add tags to all documents
        for (const docId of request.documentIds) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}/tags`, {
              method: "POST",
              headers: {
                ...getAuthHeaders(),
              },
              body: JSON.stringify({ tag_ids: request.payload.tags }),
            });
            
            if (!response.ok) {
              console.warn(`Failed to add tags to document ${docId}`);
            }
          } catch (error) {
            console.error(`Failed to add tags to document ${docId}:`, error);
          }
        }
        return;
      }
      
      if (request.action === "untag" && request.payload?.tags) {
        // Remove tags from all documents
        for (const docId of request.documentIds) {
          for (const tagId of request.payload.tags) {
            try {
              const response = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}/tags/${tagId}`, {
                method: "DELETE",
                headers: {
                  ...getAuthHeaders(),
                },
              });
              
              if (!response.ok) {
                console.warn(`Failed to remove tag ${tagId} from document ${docId}`);
              }
            } catch (error) {
              console.error(`Failed to remove tag ${tagId} from document ${docId}:`, error);
            }
          }
        }
        return;
      }
      
      // For other actions (delete, move), use mock for now
      // TODO: Implement backend endpoints for these bulk operations
      await delay(500);
      request.documentIds.forEach((docId) => {
        const doc = mockDocuments.find((d) => d.id === docId);
        if (!doc) return;

        switch (request.action) {
          case "delete":
            mockDocuments = mockDocuments.filter((d) => d.id !== docId);
            break;
          case "move":
            if (request.payload?.projectId !== undefined) {
              doc.projectId = request.payload.projectId;
            }
            break;
        }
      });
    } catch (error) {
      console.error("Failed to perform bulk action via backend, using mock:", error);
      // Fallback to mock implementation
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
    }
  },
};

// Tags API
export const tagsApi = {
  async list(): Promise<DocumentTag[]> {
    try {
      const data = await apiClient.get<any[]>("/api/v1/tags/");
      
      if (data) {
        // Convert backend tags to frontend format
        const tags: DocumentTag[] = data.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color || "#6b7280",
          createdAt: new Date(tag.created_at),
        }));

        // Update mock tags for compatibility
        mockTags = tags;

        return tags;
      }
      // If response is not ok, fall through to mock implementation
    } catch (error) {
      console.error("Failed to fetch tags from backend, using mock data:", error);
      // Fallback to mock implementation
    }

    // Fallback to mock implementation
    await delay(200);
    return [...mockTags];
  },

  async create(name: string, color?: string): Promise<DocumentTag> {
    try {
      const tag = await apiClient.post<any>("/api/v1/tags/", {
        name,
        color: color || "#6b7280",
      });
      
      if (tag) {
        // Convert backend tag to frontend format
        const newTag: DocumentTag = {
          id: tag.id,
          name: tag.name,
          color: tag.color || "#6b7280",
          createdAt: new Date(tag.created_at),
        };

        // Update mock tags for compatibility
        mockTags.push(newTag);

        return newTag;
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Failed to create tag" }));
        throw new Error(errorData.detail || "Failed to create tag");
      }
    } catch (error) {
      console.error("Failed to create tag in backend, using mock data:", error);
      // Fallback to mock implementation
    }

    // Fallback to mock implementation
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

  async update(id: string, name?: string, color?: string): Promise<DocumentTag> {
    try {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (color !== undefined) updateData.color = color;

      const tag = await apiClient.put<any>(`/api/v1/tags/${id}`, updateData);
      
      if (tag) {
        // Convert backend tag to frontend format
        const updatedTag: DocumentTag = {
          id: tag.id,
          name: tag.name,
          color: tag.color || "#6b7280",
          createdAt: new Date(tag.created_at),
        };

        // Update mock tags for compatibility
        const index = mockTags.findIndex((t) => t.id === id);
        if (index !== -1) {
          mockTags[index] = updatedTag;
        }

        return updatedTag;
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update tag" }));
        throw new Error(errorData.detail || "Failed to update tag");
      }
    } catch (error) {
      console.error("Failed to update tag in backend, using mock data:", error);
      // Fallback to mock implementation
    }

    // Fallback to mock implementation
    await delay(300);
    const tag = mockTags.find((t) => t.id === id);
    if (!tag) {
      throw new Error("Tag not found");
    }
    if (name !== undefined) tag.name = name;
    if (color !== undefined) tag.color = color;
    return tag;
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/tags/${id}`);
      
      // Remove tag from mock tags
      mockTags = mockTags.filter((t) => t.id !== id);
      // Remove tag from all documents
      mockDocuments.forEach((d) => {
        d.tags = d.tags.filter((t) => t !== id);
      });
      return;
    } catch (error) {
      console.error("Failed to delete tag in backend, using mock data:", error);
      // Fallback to mock implementation
    }

    // Fallback to mock implementation
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
          ...getAuthHeaders(),
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
  async query(request: CrossDocumentQueryRequest, signal?: AbortSignal): Promise<CrossDocumentQueryResponse> {
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

        response = await queryApi.query(queryRequest, signal);
        
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
          ...getAuthHeaders(),
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
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${request.documentId}/share`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permission: request.permission,
          access: request.access,
          allowed_users: request.allowedUsers,
          expires_at: request.expiresAt ? request.expiresAt.toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Map backend response to frontend format
      return {
        id: data.id,
        documentId: data.document_id,
        shareToken: data.share_token,
        shareUrl: data.share_url,
        permission: data.permission,
        access: data.access,
        allowedUsers: data.allowed_users,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        createdAt: new Date(data.created_at),
        createdBy: data.created_by,
        isActive: data.is_active,
      };
    } catch (error) {
      console.error("Failed to create share link:", error);
      throw error;
    }
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
   * @param request Query request
   * @param signal Optional AbortSignal for cancellation
   */
  async query(request: QueryRequest, signal?: AbortSignal): Promise<QueryResponse> {
    try {
      return await apiClient.post<QueryResponse>("/api/v1/query/", request, {
        signal, // Support cancellation
        skipRetry: signal?.aborted, // Don't retry if already aborted
      });
    } catch (error) {
      // Handle cancellation
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Query cancelled");
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
        headers: getAuthHeaders(),
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
    return apiClient.get<QueryHistoryResponse>("/api/v1/query/history");
  },

  /**
   * Get query performance metrics
   * @param startDate Optional start date for filtering (ISO format)
   * @param endDate Optional end date for filtering (ISO format)
   */
  async getPerformance(startDate?: string, endDate?: string): Promise<{
    success_rate: number;
    average_response_time: number;
    total_queries: number;
    successful_queries: number;
    failed_queries: number;
    top_queries: Array<{
      query: string;
      count: number;
      avg_time: number;
    }>;
    recent_errors: Array<{
      query: string;
      error: string;
      timestamp: string;
    }>;
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    
    const queryString = params.toString();
    const url = `/api/v1/query/performance${queryString ? `?${queryString}` : ""}`;
    
    return apiClient.get(url);
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },
};

// Saved Analyses API
export const savedAnalysesApi = {
  /**
   * List all saved analyses for the current user
   */
  async list(): Promise<SavedCrossDocumentAnalysis[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyses`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map backend response to SavedCrossDocumentAnalysis format
      return (data.analyses || []).map((analysis: any) => ({
        id: analysis.id,
        documentIds: analysis.document_ids || [],
        documentNames: analysis.document_names || [],
        savedAt: analysis.created_at || analysis.updated_at || new Date().toISOString(),
        hasComparison: analysis.has_comparison || false,
        hasPatterns: analysis.has_patterns || false,
        hasContradictions: analysis.has_contradictions || false,
        hasMessages: analysis.has_messages || false,
      }));
    } catch (error) {
      console.error("Failed to list saved analyses:", error);
      throw error;
    }
  },

  /**
   * Create or update a saved analysis
   */
  async create(analysis: {
    documentIds: string[];
    documentNames: string[];
    hasComparison: boolean;
    hasPatterns: boolean;
    hasContradictions: boolean;
    hasMessages: boolean;
  }): Promise<SavedCrossDocumentAnalysis> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          document_ids: analysis.documentIds,
          document_names: analysis.documentNames,
          has_comparison: analysis.hasComparison,
          has_patterns: analysis.hasPatterns,
          has_contradictions: analysis.hasContradictions,
          has_messages: analysis.hasMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map backend response to SavedCrossDocumentAnalysis format
      return {
        id: data.id,
        documentIds: data.document_ids || [],
        documentNames: data.document_names || [],
        savedAt: data.created_at || data.updated_at || new Date().toISOString(),
        hasComparison: data.has_comparison || false,
        hasPatterns: data.has_patterns || false,
        hasContradictions: data.has_contradictions || false,
        hasMessages: data.has_messages || false,
      };
    } catch (error) {
      console.error("Failed to create saved analysis:", error);
      throw error;
    }
  },

  /**
   * Get a saved analysis by ID
   */
  async get(analysisId: string): Promise<SavedCrossDocumentAnalysis> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyses/${analysisId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map backend response to SavedCrossDocumentAnalysis format
      return {
        id: data.id,
        documentIds: data.document_ids || [],
        documentNames: data.document_names || [],
        savedAt: data.created_at || data.updated_at || new Date().toISOString(),
        hasComparison: data.has_comparison || false,
        hasPatterns: data.has_patterns || false,
        hasContradictions: data.has_contradictions || false,
        hasMessages: data.has_messages || false,
      };
    } catch (error) {
      console.error("Failed to get saved analysis:", error);
      throw error;
    }
  },

  /**
   * Delete a saved analysis
   */
  async delete(analysisId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyses/${analysisId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to delete saved analysis:", error);
      throw error;
    }
  },
};

// Organizations API
export const organizationsApi = {
  /**
   * Create a new organization
   */
  async create(request: CreateOrganizationRequest): Promise<Organization> {
    const data = await apiClient.post<any>("/api/v1/organizations", request);
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      plan: data.plan,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Get organization by ID
   */
  async get(orgId: string): Promise<Organization> {
    const data = await apiClient.get<any>(`/api/v1/organizations/${orgId}`);
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      plan: data.plan,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Update organization
   */
  async update(orgId: string, request: UpdateOrganizationRequest): Promise<Organization> {
    const data = await apiClient.put<any>(`/api/v1/organizations/${orgId}`, request);
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      plan: data.plan,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * List organization members
   */
  async listMembers(orgId: string): Promise<OrganizationMemberList> {
    const data = await apiClient.get<any>(`/api/v1/organizations/${orgId}/members`);
    return {
      members: data.members.map((m: any) => ({
        userId: m.user_id,
        email: m.email,
        name: m.name,
        role: m.role,
        joinedAt: new Date(m.joined_at),
      })),
      total: data.total,
    };
  },

  /**
   * Invite a member to the organization
   */
  async inviteMember(orgId: string, request: InviteMemberRequest): Promise<OrganizationMember> {
    const data = await apiClient.post<any>(`/api/v1/organizations/${orgId}/members`, request);
    return {
      userId: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      joinedAt: new Date(data.joined_at),
    };
  },

  /**
   * Remove a member from the organization
   */
  async removeMember(orgId: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/v1/organizations/${orgId}/members/${userId}`);
  },

  /**
   * Update member role
   */
  async updateMemberRole(orgId: string, userId: string, request: UpdateMemberRoleRequest): Promise<OrganizationMember> {
    const data = await apiClient.put<any>(`/api/v1/organizations/${orgId}/members/${userId}/role`, request);
    return {
      userId: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      joinedAt: new Date(data.joined_at),
    };
  },

  /**
   * Get organization settings
   */
  async getSettings(orgId: string): Promise<OrganizationSettings> {
    const data = await apiClient.get<any>(`/api/v1/organizations/${orgId}/settings`);
    return {
      organizationId: data.organization_id,
      dataRetentionDays: data.data_retention_days,
      require2fa: data.require_2fa,
      allowGuestAccess: data.allow_guest_access,
      maxUsers: data.max_users,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Update organization settings
   */
  async updateSettings(orgId: string, request: UpdateOrganizationSettingsRequest): Promise<OrganizationSettings> {
    const data = await apiClient.put<any>(`/api/v1/organizations/${orgId}/settings`, {
      data_retention_days: request.dataRetentionDays,
      require_2fa: request.require2fa,
      allow_guest_access: request.allowGuestAccess,
      max_users: request.maxUsers,
    });
    return {
      organizationId: data.organization_id,
      dataRetentionDays: data.data_retention_days,
      require2fa: data.require_2fa,
      allowGuestAccess: data.allow_guest_access,
      maxUsers: data.max_users,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },
};

// Activity API
export const activityApi = {
  /**
   * Get activity feed
   */
  async list(filters?: ActivityFilterParams): Promise<ActivityListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.type) params.append("type", filters.type);
      if (filters?.userId) params.append("user_id", filters.userId);
      if (filters?.organizationId) params.append("organization_id", filters.organizationId);
      if (filters?.documentId) params.append("document_id", filters.documentId);
      if (filters?.projectId) params.append("project_id", filters.projectId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.startDate) params.append("start_date", filters.startDate.toISOString());
      if (filters?.endDate) params.append("end_date", filters.endDate.toISOString());
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/api/v1/activity${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        activities: data.activities.map((a: any) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          userId: a.user_id,
          userName: a.user_name,
          organizationId: a.organization_id,
          documentId: a.document_id,
          projectId: a.project_id,
          status: a.status,
          metadata: a.metadata || {},
          createdAt: new Date(a.created_at),
        })),
        total: data.total,
        page: data.page,
        limit: data.limit,
        hasMore: data.has_more,
      };
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Failed to connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running.`
        );
      }
      throw error;
    }
  },
};

// Metrics API
export const metricsApi = {
  /**
   * Get document metrics
   */
  async getDocumentMetrics(): Promise<DocumentMetricsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/metrics/documents`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        metrics: data.metrics.map((m: any) => ({
          label: m.label,
          value: m.value,
          change: m.change,
          trend: m.trend,
        })),
        totalDocuments: data.total_documents,
        processedThisMonth: data.processed_this_month,
        storageUsedGb: data.storage_used_gb,
      };
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Failed to connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running.`
        );
      }
      throw error;
    }
  },

  /**
   * Get storage metrics
   */
  async getStorageMetrics(): Promise<StorageMetricsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/metrics/storage`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        storage: {
          usedGb: data.storage.used_gb,
          limitGb: data.storage.limit_gb,
          percentage: data.storage.percentage,
          usedFormatted: data.storage.used_formatted,
          limitFormatted: data.storage.limit_formatted,
        },
        breakdown: data.breakdown,
      };
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Failed to connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running.`
        );
      }
      throw error;
    }
  },
};

