/**
 * Conversation history persistence utilities
 */

import { tokenStorage } from "@/services/authService";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    text: string;
    page?: number;
    section?: string;
  }>;
  timestamp: string; // ISO string
  status?: string;
  error?: string;
  canRetry?: boolean;
}

/**
 * Get current user ID from token storage
 * Returns empty string if not authenticated (for backward compatibility)
 */
function getUserId(): string {
  try {
    const token = tokenStorage.getAccessToken();
    if (!token) return "";
    
    const parts = token.split(".");
    if (parts.length !== 3) return "";
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || payload.user_id || payload.id || "";
  } catch (error) {
    console.warn("Failed to get user ID from token:", error);
    return "";
  }
}

/**
 * Get user-scoped storage prefix
 */
function getUserPrefix(): string {
  const userId = getUserId();
  return userId ? `user_${userId}_` : "";
}

const STORAGE_KEY_PREFIX = "documind_conversation_";
const MAX_STORED_CONVERSATIONS = 50; // Limit stored conversations per document

/**
 * Get storage key for a document's conversation history (user-scoped)
 */
function getStorageKey(documentId: string): string {
  const userPrefix = getUserPrefix();
  return `${STORAGE_KEY_PREFIX}${userPrefix}${documentId}`;
}

/**
 * Save conversation history for a document
 */
export function saveConversationHistory(
  documentId: string,
  messages: StoredMessage[]
): void {
  try {
    const key = getStorageKey(documentId);
    const data = {
      documentId,
      messages: messages.slice(-MAX_STORED_CONVERSATIONS), // Keep only recent messages
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save conversation history:", error);
    // Silently fail - don't break the app if storage is unavailable
  }
}

/**
 * Load conversation history for a document
 */
export function loadConversationHistory(documentId: string): StoredMessage[] {
  try {
    const key = getStorageKey(documentId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const data = JSON.parse(stored);
    if (!data.messages || !Array.isArray(data.messages)) {
      return [];
    }

    return data.messages;
  } catch (error) {
    console.error("Failed to load conversation history:", error);
    return [];
  }
}

/**
 * Clear conversation history for a document
 */
export function clearConversationHistory(documentId: string): void {
  try {
    const key = getStorageKey(documentId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear conversation history:", error);
  }
}

/**
 * Clear all conversation histories
 */
export function clearAllConversationHistories(): void {
  try {
    const keys = Object.keys(localStorage);
    const userPrefix = getUserPrefix();
    const prefix = `${STORAGE_KEY_PREFIX}${userPrefix}`;
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to clear all conversation histories:", error);
  }
}

/**
 * Get list of documents with saved conversation histories
 */
export function getDocumentsWithHistory(): string[] {
  try {
    const keys = Object.keys(localStorage);
    const userPrefix = getUserPrefix();
    const prefix = `${STORAGE_KEY_PREFIX}${userPrefix}`;
    return keys
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.replace(prefix, ""));
  } catch (error) {
    console.error("Failed to get documents with history:", error);
    return [];
  }
}

