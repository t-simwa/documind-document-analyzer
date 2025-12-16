/**
 * Error handling utilities for better error categorization and user feedback
 */

export enum ErrorType {
  NETWORK = "network",
  API = "api",
  VALIDATION = "validation",
  TIMEOUT = "timeout",
  CANCELLED = "cancelled",
  UNKNOWN = "unknown",
}

export interface CategorizedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  originalError?: Error;
}

/**
 * Categorize and format errors for better user experience
 */
export function categorizeError(error: unknown): CategorizedError {
  // Handle cancellation
  if (error instanceof Error && error.name === "AbortError") {
    return {
      type: ErrorType.CANCELLED,
      message: "Query cancelled",
      userMessage: "Query was cancelled.",
      canRetry: false,
      originalError: error,
    };
  }

  // Handle network errors
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      userMessage: "Unable to connect to the server. Please check your internet connection and try again.",
      canRetry: true,
      originalError: error,
    };
  }

  // Handle timeout errors
  if (error instanceof Error && (error.message.includes("timeout") || error.message.includes("Timeout"))) {
    return {
      type: ErrorType.TIMEOUT,
      message: error.message,
      userMessage: "The request took too long to complete. Please try again with a simpler query.",
      canRetry: true,
      originalError: error,
    };
  }

  // Handle API errors (HTTP errors)
  if (error instanceof Error) {
    // Check for HTTP status codes in the message
    const httpErrorMatch = error.message.match(/HTTP (\d+)/);
    if (httpErrorMatch) {
      const statusCode = parseInt(httpErrorMatch[1]);
      let userMessage = "An error occurred while processing your query.";
      
      switch (statusCode) {
        case 400:
          userMessage = "Invalid query request. Please check your input and try again.";
          break;
        case 401:
          userMessage = "Authentication required. Please log in and try again.";
          break;
        case 403:
          userMessage = "You don't have permission to perform this action.";
          break;
        case 404:
          userMessage = "The requested resource was not found.";
          break;
        case 429:
          userMessage = "Too many requests. Please wait a moment and try again.";
          break;
        case 500:
          userMessage = "Server error occurred. Please try again later.";
          break;
        case 503:
          userMessage = "Service temporarily unavailable. Please try again later.";
          break;
      }

      return {
        type: ErrorType.API,
        message: error.message,
        userMessage,
        canRetry: statusCode >= 500 || statusCode === 429,
        originalError: error,
      };
    }

    // Handle validation errors
    if (error.message.includes("validation") || error.message.includes("invalid")) {
      return {
        type: ErrorType.VALIDATION,
        message: error.message,
        userMessage: error.message || "Invalid input. Please check your query and try again.",
        canRetry: false,
        originalError: error,
      };
    }

    // Generic error
    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      userMessage: error.message || "An unexpected error occurred. Please try again.",
      canRetry: true,
      originalError: error,
    };
  }

  // Fallback for unknown error types
  return {
    type: ErrorType.UNKNOWN,
    message: String(error),
    userMessage: "An unexpected error occurred. Please try again.",
    canRetry: true,
  };
}

/**
 * Get a user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  return categorizeError(error).userMessage;
}

