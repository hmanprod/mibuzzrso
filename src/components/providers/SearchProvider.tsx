'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { searchPosts } from '@/app/feed/actions/post';
import type { ExtendedPost } from '@/types/database';

interface SearchContextType {
  searchTerm: string;
  searchResults: ExtendedPost[];
  isLoading: boolean;
  error: string | null;
  setSearchTerm: (term: string) => void;
  performSearch: (term?: string) => Promise<void>;
  clearResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExtendedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (term?: string) => {
    const queryTerm = term !== undefined ? term : searchTerm;
    
    if (!queryTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await searchPosts(1, 20, queryTerm);
      
      if (result.error) {
        setError(result.error);
        setSearchResults([]);
      } else if (result.posts) {
        setSearchResults(result.posts);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Une erreur est survenue lors de la recherche');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setSearchTerm('');
    setError(null);
  }, []);

  const value = {
    searchTerm,
    searchResults,
    isLoading,
    error,
    setSearchTerm,
    performSearch,
    clearResults
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
