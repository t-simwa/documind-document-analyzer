// Document Store using Zustand for API state caching
import { create } from 'zustand';
import { Document } from '@/types/api';

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setSelectedDocument: (document: Document | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearDocuments: () => void;
  isStale: (maxAge?: number) => boolean;
}

const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  selectedDocument: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  
  setDocuments: (documents) => set({ 
    documents, 
    lastFetched: Date.now(),
    error: null 
  }),
  
  addDocument: (document) => set((state) => ({
    documents: [document, ...state.documents],
    lastFetched: Date.now(),
  })),
  
  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map((doc) =>
      doc.id === id ? { ...doc, ...updates } : doc
    ),
    selectedDocument: state.selectedDocument?.id === id
      ? { ...state.selectedDocument, ...updates }
      : state.selectedDocument,
  })),
  
  removeDocument: (id) => set((state) => ({
    documents: state.documents.filter((doc) => doc.id !== id),
    selectedDocument: state.selectedDocument?.id === id
      ? null
      : state.selectedDocument,
  })),
  
  setSelectedDocument: (document) => set({ selectedDocument: document }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearDocuments: () => set({ 
    documents: [], 
    selectedDocument: null,
    lastFetched: null,
    error: null 
  }),
  
  isStale: (maxAge = DEFAULT_MAX_AGE) => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    return Date.now() - lastFetched > maxAge;
  },
}));

