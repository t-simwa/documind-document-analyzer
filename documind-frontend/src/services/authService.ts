// Authentication Service
import { apiClient } from "./apiClient";

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
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
    return apiClient.post<TokenResponse>("/api/v1/auth/register", request, {
      skipAuth: true,
    });
  },

  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>("/api/v1/auth/login", request, {
      skipAuth: true,
    });
  },

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>("/api/v1/auth/refresh", { refresh_token: refreshToken }, {
      skipAuth: true,
    });
  },

  /**
   * Get current user information
   */
  async getMe(): Promise<UserMeResponse> {
    try {
      const data = await apiClient.get<UserMeResponse>("/api/v1/auth/me");
      console.log("authService.getMe: Full API response:", JSON.stringify(data, null, 2));
      console.log("authService.getMe: user.organization_id:", data?.user?.organization_id);
      return data;
    } catch (error: any) {
      // Handle 401 by attempting token refresh
      if (error?.status === 401) {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            const newTokens = await authApi.refresh(refreshToken);
            tokenStorage.setTokens(newTokens.access_token, newTokens.refresh_token);
            // Retry with new token
            const data = await apiClient.get<UserMeResponse>("/api/v1/auth/me");
            console.log("authService.getMe: Full API response:", JSON.stringify(data, null, 2));
            console.log("authService.getMe: user.organization_id:", data?.user?.organization_id);
            return data;
          } catch (refreshError) {
            // Refresh failed, clear tokens
            tokenStorage.clearTokens();
            throw new Error("Session expired. Please login again.");
          }
        }
        tokenStorage.clearTokens();
        throw new Error("Session expired. Please login again.");
      }
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/v1/auth/logout", {});
    } catch (error) {
      // Ignore logout errors, still clear tokens
      console.error("Logout request failed:", error);
    }
    tokenStorage.clearTokens();
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return apiClient.post<VerifyEmailResponse>("/api/v1/auth/verify-email", request, {
      skipAuth: true,
    });
  },

  /**
   * Resend verification email
   */
  async resendVerification(request: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    // Auth is optional for this endpoint - apiClient will add token if available
    return apiClient.post<ResendVerificationResponse>("/api/v1/auth/resend-verification", request);
  },

  /**
   * Request password reset email
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>("/api/v1/auth/forgot-password", request, {
      skipAuth: true,
    });
  },

  /**
   * Reset password with token
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>("/api/v1/auth/reset-password", request, {
      skipAuth: true,
    });
  },
};

