/**
 * Cross-document analysis data persistence utilities
 */

import type { DocumentComparison, DocumentPattern, DocumentContradiction } from "@/types/api";

export interface StoredCrossDocumentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    text: string;
    page?: number;
    section?: string;
    documentId?: string;
    documentName?: string;
  }>;
  timestamp: string; // ISO string
  status?: string;
  error?: string;
  canRetry?: boolean;
}

const STORAGE_KEY_PREFIX = "documind_crossdoc_";
const STORAGE_KEY_PREFIX_COMPARISON = "documind_crossdoc_comparison_";
const STORAGE_KEY_PREFIX_PATTERNS = "documind_crossdoc_patterns_";
const STORAGE_KEY_PREFIX_CONTRADICTIONS = "documind_crossdoc_contradictions_";
const STORAGE_KEY_PREFIX_ANALYSIS = "documind_crossdoc_analysis_"; // Complete analysis metadata
const MAX_STORED_MESSAGES = 50;

/**
 * Get storage key for a document set's conversation history
 */
function getStorageKey(documentIds: string[]): string {
  const sortedIds = [...documentIds].sort().join(",");
  return `${STORAGE_KEY_PREFIX}${sortedIds}`;
}

/**
 * Save conversation history for a document set
 */
export function saveCrossDocumentHistory(
  documentIds: string[],
  messages: StoredCrossDocumentMessage[]
): void {
  try {
    const key = getStorageKey(documentIds);
    const data = {
      documentIds,
      messages: messages.slice(-MAX_STORED_MESSAGES),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save cross-document history:", error);
  }
}

/**
 * Load conversation history for a document set
 */
export function loadCrossDocumentHistory(documentIds: string[]): StoredCrossDocumentMessage[] {
  try {
    const key = getStorageKey(documentIds);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const data = JSON.parse(stored);
    if (!data.messages || !Array.isArray(data.messages)) {
      return [];
    }

    return data.messages;
  } catch (error) {
    console.error("Failed to load cross-document history:", error);
    return [];
  }
}

/**
 * Clear conversation history for a document set
 */
export function clearCrossDocumentHistory(documentIds: string[]): void {
  try {
    const key = getStorageKey(documentIds);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear cross-document history:", error);
  }
}

/**
 * Get storage key for a document set's comparison
 */
function getComparisonStorageKey(documentIds: string[]): string {
  const sortedIds = [...documentIds].sort().join(",");
  return `${STORAGE_KEY_PREFIX_COMPARISON}${sortedIds}`;
}

/**
 * Save comparison analysis for a document set
 */
export function saveCrossDocumentComparison(
  documentIds: string[],
  comparison: DocumentComparison
): void {
  try {
    const key = getComparisonStorageKey(documentIds);
    const data = {
      documentIds,
      comparison: {
        ...comparison,
        generatedAt: comparison.generatedAt.toISOString(),
      },
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save cross-document comparison:", error);
  }
}

/**
 * Load comparison analysis for a document set
 */
export function loadCrossDocumentComparison(documentIds: string[]): DocumentComparison | null {
  try {
    const key = getComparisonStorageKey(documentIds);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data.comparison) return null;

    return {
      ...data.comparison,
      generatedAt: new Date(data.comparison.generatedAt),
    };
  } catch (error) {
    console.error("Failed to load cross-document comparison:", error);
    return null;
  }
}

/**
 * Clear comparison analysis for a document set
 */
export function clearCrossDocumentComparison(documentIds: string[]): void {
  try {
    const key = getComparisonStorageKey(documentIds);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear cross-document comparison:", error);
  }
}

/**
 * Save patterns for a document set
 */
export function saveCrossDocumentPatterns(
  documentIds: string[],
  patterns: DocumentPattern[]
): void {
  try {
    const sortedIds = [...documentIds].sort().join(",");
    const key = `${STORAGE_KEY_PREFIX_PATTERNS}${sortedIds}`;
    const data = {
      documentIds,
      patterns,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save cross-document patterns:", error);
  }
}

/**
 * Load patterns for a document set
 */
export function loadCrossDocumentPatterns(documentIds: string[]): DocumentPattern[] {
  try {
    const sortedIds = [...documentIds].sort().join(",");
    const key = `${STORAGE_KEY_PREFIX_PATTERNS}${sortedIds}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const data = JSON.parse(stored);
    return data.patterns || [];
  } catch (error) {
    console.error("Failed to load cross-document patterns:", error);
    return [];
  }
}

/**
 * Save contradictions for a document set
 */
export function saveCrossDocumentContradictions(
  documentIds: string[],
  contradictions: DocumentContradiction[]
): void {
  try {
    const sortedIds = [...documentIds].sort().join(",");
    const key = `${STORAGE_KEY_PREFIX_CONTRADICTIONS}${sortedIds}`;
    const data = {
      documentIds,
      contradictions,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save cross-document contradictions:", error);
  }
}

/**
 * Load contradictions for a document set
 */
export function loadCrossDocumentContradictions(documentIds: string[]): DocumentContradiction[] {
  try {
    const sortedIds = [...documentIds].sort().join(",");
    const key = `${STORAGE_KEY_PREFIX_CONTRADICTIONS}${sortedIds}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const data = JSON.parse(stored);
    return data.contradictions || [];
  } catch (error) {
    console.error("Failed to load cross-document contradictions:", error);
    return [];
  }
}

/**
 * Save complete analysis metadata (for listing saved analyses)
 */
export interface SavedCrossDocumentAnalysis {
  id: string; // documentIds sorted and joined
  documentIds: string[];
  documentNames: string[];
  savedAt: string;
  hasComparison: boolean;
  hasPatterns: boolean;
  hasContradictions: boolean;
  hasMessages: boolean;
}

export function saveCrossDocumentAnalysisMetadata(
  documentIds: string[],
  documentNames: string[],
  hasComparison: boolean,
  hasPatterns: boolean,
  hasContradictions: boolean,
  hasMessages: boolean
): void {
  try {
    const sortedIds = [...documentIds].sort();
    const id = sortedIds.join(",");
    const key = `${STORAGE_KEY_PREFIX_ANALYSIS}${id}`;
    const data: SavedCrossDocumentAnalysis = {
      id,
      documentIds: sortedIds,
      documentNames,
      savedAt: new Date().toISOString(),
      hasComparison,
      hasPatterns,
      hasContradictions,
      hasMessages,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save cross-document analysis metadata:", error);
  }
}

/**
 * Get all saved cross-document analyses
 */
export function getAllSavedCrossDocumentAnalyses(): SavedCrossDocumentAnalysis[] {
  try {
    const keys = Object.keys(localStorage);
    const analyses: SavedCrossDocumentAnalysis[] = [];
    
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX_ANALYSIS)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          analyses.push(data);
        } catch (error) {
          console.error("Failed to parse saved analysis:", error);
        }
      }
    });
    
    // Sort by most recent first
    analyses.sort((a, b) => {
      const dateA = new Date(a.savedAt).getTime();
      const dateB = new Date(b.savedAt).getTime();
      return dateB - dateA;
    });
    
    return analyses;
  } catch (error) {
    console.error("Failed to get saved cross-document analyses:", error);
    return [];
  }
}

/**
 * Delete a saved cross-document analysis (all related data)
 */
export function deleteSavedCrossDocumentAnalysis(documentIds: string[]): void {
  try {
    const sortedIds = [...documentIds].sort().join(",");
    
    // Delete all related storage
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sortedIds}`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX_COMPARISON}${sortedIds}`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX_PATTERNS}${sortedIds}`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX_CONTRADICTIONS}${sortedIds}`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX_ANALYSIS}${sortedIds}`);
  } catch (error) {
    console.error("Failed to delete saved cross-document analysis:", error);
  }
}

