/**
 * Conversation history persistence utilities
 */

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

const STORAGE_KEY_PREFIX = "documind_conversation_";
const MAX_STORED_CONVERSATIONS = 50; // Limit stored conversations per document

/**
 * Get storage key for a document's conversation history
 */
function getStorageKey(documentId: string): string {
  return `${STORAGE_KEY_PREFIX}${documentId}`;
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
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
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
    return keys
      .filter((key) => key.startsWith(STORAGE_KEY_PREFIX))
      .map((key) => key.replace(STORAGE_KEY_PREFIX, ""));
  } catch (error) {
    console.error("Failed to get documents with history:", error);
    return [];
  }
}

