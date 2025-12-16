// Query Caching Service
// Caches query responses to avoid redundant API calls

import type { QueryRequest, QueryResponse } from "@/types/api";
import type { QueryConfig, CachedQuery } from "@/types/query";
import { QUERY_CACHE_TTL } from "@/types/query";

// In-memory cache (could be replaced with IndexedDB for persistence)
const queryCache = new Map<string, CachedQuery>();

/**
 * Generate a cache key from query request
 */
function generateCacheKey(
  query: string,
  documentIds: string[],
  collectionName: string,
  config: QueryConfig
): string {
  // Create a stable key from query parameters
  const configStr = JSON.stringify({
    search_type: config.search_type,
    top_k: config.top_k,
    rerank_enabled: config.rerank_enabled,
    temperature: config.temperature,
    max_tokens: config.max_tokens,
    generate_insights: config.generate_insights,
  });
  
  const docIdsStr = documentIds.sort().join(",");
  return `${collectionName}:${docIdsStr}:${query}:${configStr}`;
}

/**
 * Get cached query response if available and not expired
 */
export function getCachedQuery(
  query: string,
  documentIds: string[],
  collectionName: string,
  config: QueryConfig
): QueryResponse | null {
  const cacheKey = generateCacheKey(query, documentIds, collectionName, config);
  const cached = queryCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if cache is expired
  if (Date.now() > cached.expiresAt) {
    queryCache.delete(cacheKey);
    return null;
  }

  return cached.response as QueryResponse;
}

/**
 * Cache a query response
 */
export function cacheQuery(
  query: string,
  documentIds: string[],
  collectionName: string,
  config: QueryConfig,
  response: QueryResponse
): void {
  const cacheKey = generateCacheKey(query, documentIds, collectionName, config);
  const now = Date.now();

  const cached: CachedQuery = {
    query,
    documentIds,
    collectionName,
    config,
    response,
    timestamp: now,
    expiresAt: now + QUERY_CACHE_TTL,
  };

  queryCache.set(cacheKey, cached);

  // Clean up expired entries periodically (every 10 minutes)
  if (queryCache.size > 100) {
    cleanupExpiredEntries();
  }
}

/**
 * Remove expired entries from cache
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, cached] of queryCache.entries()) {
    if (now > cached.expiresAt) {
      queryCache.delete(key);
    }
  }
}

/**
 * Clear all cached queries
 */
export function clearQueryCache(): void {
  queryCache.clear();
}

/**
 * Clear cached queries for specific documents
 */
export function clearCacheForDocuments(documentIds: string[]): void {
  for (const [key, cached] of queryCache.entries()) {
    if (cached.documentIds.some((id) => documentIds.includes(id))) {
      queryCache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: number;
} {
  cleanupExpiredEntries();
  return {
    size: queryCache.size,
    entries: queryCache.size,
  };
}

