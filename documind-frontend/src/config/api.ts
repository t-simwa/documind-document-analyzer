// API Configuration
// Environment variables are loaded from .env files
// See .env.example for all available variables

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const DEFAULT_COLLECTION_NAME = import.meta.env.VITE_DEFAULT_COLLECTION_NAME || "documind_documents";
export const ENV = import.meta.env.VITE_ENV || import.meta.env.MODE || "development";

// Feature flags
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === "true";
export const ENABLE_ERROR_TRACKING = import.meta.env.VITE_ENABLE_ERROR_TRACKING === "true";

// OAuth redirect URIs (if needed)
export const GOOGLE_OAUTH_REDIRECT_URI = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI;
export const MICROSOFT_OAUTH_REDIRECT_URI = import.meta.env.VITE_MICROSOFT_OAUTH_REDIRECT_URI;

// Public API keys (if needed)
export const PUBLIC_API_KEY = import.meta.env.VITE_PUBLIC_API_KEY;

// Validate required environment variables in production
if (ENV === "production") {
  if (!API_BASE_URL || API_BASE_URL === "http://localhost:8000") {
    console.warn("⚠️ VITE_API_BASE_URL is not set for production!");
  }
}

