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
} from "@/types/api";

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
let mockTags: DocumentTag[] = [
  { id: "1", name: "Important", color: "#ef4444", createdAt: new Date() },
  { id: "2", name: "Review", color: "#f59e0b", createdAt: new Date() },
  { id: "3", name: "Archive", color: "#6b7280", createdAt: new Date() },
];

let mockUsers: User[] = [
  { id: "user1", name: "Current User", email: "user@example.com" },
];

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
    if (params?.projectId !== undefined) {
      if (params.projectId === null) {
        filtered = filtered.filter((d) => !d.projectId || d.projectId === null);
      } else {
        filtered = filtered.filter((d) => d.projectId === params.projectId);
      }
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
    const newDoc: Document = {
      id: Date.now().toString(),
      name: file.name,
      status: "processing",
      uploadedAt: new Date(),
      uploadedBy: "user1",
      size: file.size,
      type: file.name.split(".").pop()?.toLowerCase() || "",
      projectId: projectId || null,
      tags: [],
    };
    mockDocuments.push(newDoc);
    return newDoc;
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

