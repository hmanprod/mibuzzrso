'use client';

import { useState, useCallback } from 'react';
import { getPosts } from '@/app/feed/actions/post';
import type { Post, Media, Profile } from '@/types/database';

interface ExtendedPost extends Post {
  profile: Profile;
  media: Media[];
  likes: number;
  is_liked: boolean;
  is_followed: boolean;
}

interface SearchResult {
  posts: ExtendedPost[];
  pagination?: {
    page: number;
    limit: number;
    total: number | null;
  };
  error?: string;
}

interface UseSearchPostsReturn {
  searchResults: SearchResult;
  isLoading: boolean;
  error: string | null;
  searchPosts: (term: string, page?: number, limit?: number) => Promise<void>;
  clearResults: () => void;
}

export function useSearchPosts(): UseSearchPostsReturn {
  const [searchResults, setSearchResults] = useState<SearchResult>({ posts: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPosts = useCallback(async (term: string, page: number = 1, limit: number = 10) => {
    if (!term.trim()) {
      setSearchResults({ posts: [] });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPosts(page, limit, term);
      
      if (result.error) {
        setError(result.error);
        setSearchResults({ posts: [], error: result.error });
      } else {
        setSearchResults({
          posts: result.posts || [],
          pagination: {
            page: result.page || page,
            limit: result.limit || limit,
            total: result.total ?? null
          }
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = 'Une erreur est survenue lors de la recherche';
      setError(errorMessage);
      setSearchResults({ posts: [], error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults({ posts: [] });
    setError(null);
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    searchPosts,
    clearResults
  };
}
