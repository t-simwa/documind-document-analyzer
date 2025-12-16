/**
 * Document data persistence utilities for summary, extracts, and comments
 */

import type { DocumentSummary, DocumentEntities, Comment } from "@/types/api";

const STORAGE_KEY_PREFIX_SUMMARY = "documind_summary_";
const STORAGE_KEY_PREFIX_EXTRACTS = "documind_extracts_";
const STORAGE_KEY_PREFIX_COMMENTS = "documind_comments_";

/**
 * Get storage key for a document's summary
 */
function getSummaryStorageKey(documentId: string): string {
  return `${STORAGE_KEY_PREFIX_SUMMARY}${documentId}`;
}

/**
 * Get storage key for a document's extracts
 */
function getExtractsStorageKey(documentId: string): string {
  return `${STORAGE_KEY_PREFIX_EXTRACTS}${documentId}`;
}

/**
 * Get storage key for a document's comments
 */
function getCommentsStorageKey(documentId: string, page?: number): string {
  const pageSuffix = page !== undefined ? `_page_${page}` : "";
  return `${STORAGE_KEY_PREFIX_COMMENTS}${documentId}${pageSuffix}`;
}

/**
 * Save document summary
 */
export function saveDocumentSummary(
  documentId: string,
  summary: DocumentSummary
): void {
  try {
    const key = getSummaryStorageKey(documentId);
    const data = {
      documentId,
      summary: {
        ...summary,
        generatedAt: summary.generatedAt.toISOString(),
      },
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save document summary:", error);
  }
}

/**
 * Load document summary
 */
export function loadDocumentSummary(documentId: string): DocumentSummary | null {
  try {
    const key = getSummaryStorageKey(documentId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data.summary) return null;

    return {
      ...data.summary,
      generatedAt: new Date(data.summary.generatedAt),
    };
  } catch (error) {
    console.error("Failed to load document summary:", error);
    return null;
  }
}

/**
 * Clear document summary
 */
export function clearDocumentSummary(documentId: string): void {
  try {
    const key = getSummaryStorageKey(documentId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear document summary:", error);
  }
}

/**
 * Save document extracts (entities)
 */
export function saveDocumentExtracts(
  documentId: string,
  entities: DocumentEntities
): void {
  try {
    const key = getExtractsStorageKey(documentId);
    const data = {
      documentId,
      entities,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save document extracts:", error);
  }
}

/**
 * Load document extracts
 */
export function loadDocumentExtracts(documentId: string): DocumentEntities | null {
  try {
    const key = getExtractsStorageKey(documentId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data.entities) return null;

    return data.entities;
  } catch (error) {
    console.error("Failed to load document extracts:", error);
    return null;
  }
}

/**
 * Clear document extracts
 */
export function clearDocumentExtracts(documentId: string): void {
  try {
    const key = getExtractsStorageKey(documentId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear document extracts:", error);
  }
}

/**
 * Save document comments
 */
export function saveDocumentComments(
  documentId: string,
  comments: Comment[],
  page?: number
): void {
  try {
    const key = getCommentsStorageKey(documentId, page);
    const data = {
      documentId,
      page,
      comments: comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        replies: comment.replies?.map((reply) => ({
          ...reply,
          createdAt: reply.createdAt.toISOString(),
        })),
      })),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save document comments:", error);
  }
}

/**
 * Load document comments
 */
export function loadDocumentComments(documentId: string, page?: number): Comment[] {
  try {
    const key = getCommentsStorageKey(documentId, page);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const data = JSON.parse(stored);
    if (!data.comments || !Array.isArray(data.comments)) {
      return [];
    }

    return data.comments.map((comment: any) => ({
      ...comment,
      createdAt: new Date(comment.createdAt),
      replies: comment.replies?.map((reply: any) => ({
        ...reply,
        createdAt: new Date(reply.createdAt),
      })),
    }));
  } catch (error) {
    console.error("Failed to load document comments:", error);
    return [];
  }
}

/**
 * Clear document comments
 */
export function clearDocumentComments(documentId: string, page?: number): void {
  try {
    const key = getCommentsStorageKey(documentId, page);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear document comments:", error);
  }
}

/**
 * Clear all data for a document (summary, extracts, comments)
 */
export function clearAllDocumentData(documentId: string): void {
  clearDocumentSummary(documentId);
  clearDocumentExtracts(documentId);
  // Clear all comment pages for this document
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(`${STORAGE_KEY_PREFIX_COMMENTS}${documentId}`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to clear document comments:", error);
  }
}

