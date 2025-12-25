// Authentication Service
import { API_BASE_URL } from "@/config/api";

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_superuser: boolean;
  organization_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserMeResponse {
  user: User;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
  email_verified: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = "documind_access_token";
const REFRESH_TOKEN_KEY = "documind_refresh_token";

// Token storage utilities
export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  hasTokens: (): boolean => {
    return !!tokenStorage.getAccessToken() && !!tokenStorage.getRefreshToken();
  },
};

// Auth API
export const authApi = {
  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Token refresh failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get current user information
   */
  async getMe(): Promise<UserMeResponse> {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            const newTokens = await authApi.refresh(refreshToken);
            tokenStorage.setTokens(newTokens.access_token, newTokens.refresh_token);
            // Retry with new token
            const retryResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newTokens.access_token}`,
              },
            });
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens
            tokenStorage.clearTokens();
            throw new Error("Session expired. Please login again.");
          }
        }
        tokenStorage.clearTokens();
        throw new Error("Session expired. Please login again.");
      }
      const error = await response.json().catch(() => ({ detail: "Failed to get user info" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("authService.getMe: Full API response:", JSON.stringify(data, null, 2));
    console.log("authService.getMe: user.organization_id:", data?.user?.organization_id);
    return data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        // Ignore logout errors, still clear tokens
        console.error("Logout request failed:", error);
      }
    }
    tokenStorage.clearTokens();
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Email verification failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Resend verification email
   */
  async resendVerification(request: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    const accessToken = tokenStorage.getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Include auth token if available, but don't require it
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/resend-verification`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to resend verification email" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },
};

