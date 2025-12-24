// Cloud Storage API Service

import { API_BASE_URL } from "@/config/api";
import { tokenStorage } from "./authService";

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

export interface CloudStorageConnection {
  id: string;
  provider: string;
  account_email?: string;
  account_name?: string;
  is_active: boolean;
  created_at: Date;
  last_sync_at?: Date;
}

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  modified_time?: Date;
  web_view_link?: string;
  is_folder: boolean;
  parent_id?: string;
}

export interface CloudFileListResponse {
  files: CloudFile[];
  next_page_token?: string;
}

export interface CloudFileImportResponse {
  document_id: string;
  name: string;
  status: string;
  message: string;
}

export const cloudStorageApi = {
  /**
   * List all cloud storage connections
   */
  async listConnections(): Promise<CloudStorageConnection[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-storage/connections`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.connections.map((conn: any) => ({
        id: conn.id,
        provider: conn.provider,
        account_email: conn.account_email,
        account_name: conn.account_name,
        is_active: conn.is_active,
        created_at: new Date(conn.created_at),
        last_sync_at: conn.last_sync_at ? new Date(conn.last_sync_at) : undefined,
      }));
    } catch (error) {
      console.error("Failed to list cloud storage connections:", error);
      throw error;
    }
  },

  /**
   * Initiate OAuth flow
   */
  async initiateOAuth(provider: string, redirectUri?: string): Promise<{ authorization_url: string; state: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-storage/oauth/initiate`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to initiate OAuth:", error);
      throw error;
    }
  },

  /**
   * Handle OAuth callback
   */
  async oauthCallback(provider: string, code: string, state: string, redirectUri?: string): Promise<CloudStorageConnection> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-storage/oauth/callback`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          code,
          state,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        provider: data.provider,
        account_email: data.account_email,
        account_name: data.account_name,
        is_active: data.is_active,
        created_at: new Date(data.created_at),
        last_sync_at: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
      };
    } catch (error) {
      console.error("Failed to handle OAuth callback:", error);
      throw error;
    }
  },

  /**
   * Disconnect cloud storage connection
   */
  async disconnectConnection(connectionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-storage/connections/${connectionId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to disconnect connection:", error);
      throw error;
    }
  },

  /**
   * List files from cloud storage
   */
  async listFiles(provider: string, folderId?: string, pageToken?: string): Promise<CloudFileListResponse> {
    try {
      const params = new URLSearchParams();
      if (folderId) params.append("folder_id", folderId);
      if (pageToken) params.append("page_token", pageToken);

      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-storage/${provider}/files?${params}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        files: data.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          size: file.size,
          mime_type: file.mime_type,
          modified_time: file.modified_time ? new Date(file.modified_time) : undefined,
          web_view_link: file.web_view_link,
          is_folder: file.is_folder,
          parent_id: file.parent_id,
        })),
        next_page_token: data.next_page_token,
      };
    } catch (error) {
      console.error("Failed to list files:", error);
      throw error;
    }
  },

  /**
   * Import file from cloud storage
   */
  async importFile(provider: string, fileId: string, projectId?: string): Promise<CloudFileImportResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-storage/${provider}/import`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          file_id: fileId,
          project_id: projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to import file:", error);
      throw error;
    }
  },
};

