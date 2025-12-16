// Query Configuration Types

export interface QueryConfig {
  search_type: "vector" | "keyword" | "hybrid";
  top_k: number;
  rerank_enabled: boolean;
  temperature: number;
  max_tokens: number;
  generate_insights: boolean;
}

export const DEFAULT_QUERY_CONFIG: QueryConfig = {
  search_type: "hybrid",
  top_k: 5,
  rerank_enabled: false,
  temperature: 0.7,
  max_tokens: 2000,
  generate_insights: false,
};

// Query Cache Types
export interface CachedQuery {
  query: string;
  documentIds: string[];
  collectionName: string;
  config: QueryConfig;
  response: any; // QueryResponse
  timestamp: number;
  expiresAt: number;
}

export const QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

