// Centralized API Client with Retry Logic, Timeout, and Interceptors
// This provides a robust HTTP client layer for all API calls

import { API_BASE_URL } from "@/config/api";
import { tokenStorage } from "./authService";

// Configuration
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number; // in milliseconds
  maxRetries?: number;
  retryDelay?: number; // initial delay in milliseconds
  retryBackoff?: number; // backoff multiplier
  retryableStatusCodes?: number[]; // HTTP status codes to retry
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  skipRetry?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryBackoff: 2, // double the delay each retry
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // timeout, rate limit, server errors
};

// Request interceptor type
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

// Response interceptor type
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

// Error interceptor type
export type ErrorInterceptor = (error: Error, config: RequestConfig) => Error | Promise<Error>;

class ApiClient {
  private config: Required<ApiClientConfig>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config?: ApiClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: Error, config: RequestConfig): Promise<Error> {
    let processedError = error;
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError, config);
    }
    return processedError;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error, response?: Response): boolean {
    // Network errors are retryable
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return true;
    }

    // Abort errors are not retryable
    if (error.name === "AbortError") {
      return false;
    }

    // Check status code
    if (response && this.config.retryableStatusCodes.includes(response.status)) {
      return true;
    }

    return false;
  }

  /**
   * Create timeout controller
   */
  private createTimeoutController(timeout: number): AbortController {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
    return controller;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    return this.config.retryDelay * Math.pow(this.config.retryBackoff, attempt);
  }

  /**
   * Make an API request with retry logic, timeout, and interceptors
   */
  async request<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    // Merge with default config
    const timeout = config.timeout ?? this.config.timeout;
    const maxRetries = config.retries ?? this.config.maxRetries;
    const skipRetry = config.skipRetry ?? false;

    // Build full URL
    const fullUrl = url.startsWith("http") ? url : `${this.config.baseURL}${url}`;

    // Prepare initial request config
    let requestConfig: RequestConfig = {
      ...config,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };

    // Add auth header if not skipped
    if (!config.skipAuth) {
      const token = tokenStorage.getAccessToken();
      if (token) {
        requestConfig.headers = {
          ...requestConfig.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    // Apply request interceptors
    requestConfig = await this.applyRequestInterceptors(requestConfig);

    let lastError: Error | null = null;
    let lastResponse: Response | null = null;

    // Retry loop
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create timeout controller
        const timeoutController = this.createTimeoutController(timeout);

        // Merge abort signals
        const abortController = new AbortController();
        if (requestConfig.signal) {
          requestConfig.signal.addEventListener("abort", () => {
            abortController.abort();
          });
        }
        timeoutController.signal.addEventListener("abort", () => {
          abortController.abort();
        });

        // Make the request
        const response = await fetch(fullUrl, {
          ...requestConfig,
          signal: abortController.signal,
        });

        // Apply response interceptors
        const processedResponse = await this.applyResponseInterceptors(response);

        // Check if response is ok
        if (!processedResponse.ok) {
          // Try to parse error response
          let errorMessage = `HTTP ${processedResponse.status}: ${processedResponse.statusText}`;
          try {
            const errorData = await processedResponse.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            // Ignore JSON parse errors
          }

          const error = new Error(errorMessage);
          (error as any).status = processedResponse.status;
          (error as any).response = processedResponse;

          // Check if retryable
          if (
            !skipRetry &&
            attempt < maxRetries &&
            this.isRetryableError(error, processedResponse)
          ) {
            lastError = error;
            lastResponse = processedResponse;

            // Wait before retrying
            const delay = this.calculateRetryDelay(attempt);
            await this.sleep(delay);

            continue; // Retry
          }

          // Not retryable or max retries reached
          throw error;
        }

        // Success - parse and return response
        const contentType = processedResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await processedResponse.json();
        } else {
          return (await processedResponse.text()) as any;
        }
      } catch (error) {
        const apiError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a timeout
        if (apiError.name === "AbortError" && !requestConfig.signal?.aborted) {
          const timeoutError = new Error(`Request timeout after ${timeout}ms`);
          (timeoutError as any).isTimeout = true;
          lastError = timeoutError;
        } else {
          lastError = apiError;
        }

        // Check if retryable
        if (
          !skipRetry &&
          attempt < maxRetries &&
          this.isRetryableError(apiError, lastResponse || undefined)
        ) {
          // Wait before retrying
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);

          continue; // Retry
        }

        // Not retryable or max retries reached
        // Apply error interceptors
        const processedError = await this.applyErrorInterceptors(apiError, requestConfig);
        throw processedError;
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      const processedError = await this.applyErrorInterceptors(lastError, requestConfig);
      throw processedError;
    }

    throw new Error("Request failed after all retries");
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: "DELETE" });
  }
}

// Create default instance
export const apiClient = new ApiClient();

// Add default request interceptor for auth headers
apiClient.addRequestInterceptor((config) => {
  // Auth header is already added in request method, but we can enhance here
  return config;
});

// Add default response interceptor for token refresh
apiClient.addResponseInterceptor(async (response) => {
  // Handle 401 by attempting token refresh (if implemented)
  if (response.status === 401) {
    // This could trigger a token refresh flow
    // For now, we'll let the calling code handle it
  }
  return response;
});

// Add default error interceptor for better error messages
apiClient.addErrorInterceptor(async (error, config) => {
  // Enhance network errors with helpful messages
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return new Error(
      `Failed to connect to backend server at ${API_BASE_URL}. ` +
        `Please ensure the backend server is running. ` +
        `If using a different port, set VITE_API_BASE_URL in your .env file.`
    );
  }

  // Enhance timeout errors
  if ((error as any).isTimeout) {
    return new Error(
      `Request timed out after ${config.timeout || DEFAULT_CONFIG.timeout}ms. ` +
        `The server may be slow or unavailable. Please try again.`
    );
  }

  return error;
});

// Export for custom instances
export { ApiClient };

