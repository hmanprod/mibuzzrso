'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/components/providers/SearchProvider';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (term: string) => void;
}

export default function SearchBar({ 
  className = '', 
  placeholder = 'Rechercher...', 
  autoFocus = false,
  onSearch
}: SearchBarProps) {
  const { searchTerm, setSearchTerm } = useSearch();
  const [inputValue, setInputValue] = useState(searchTerm);
  const router = useRouter();

  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchTerm(inputValue);
      
      if (onSearch) {
        onSearch(inputValue);
      } else {
        // Get current path
        const currentPath = window.location.pathname;
        let searchPath: string;

        // Determine search path based on current location
        if (currentPath.startsWith('/musics')) {
          // Déterminer le type de recherche de musique
          if (currentPath.includes('/my-musics')) {
            searchPath = `/musics/my-musics/search?q=${encodeURIComponent(inputValue)}`;
          } else if (currentPath.includes('/abonnements')) {
            searchPath = `/musics/abonnements/search?q=${encodeURIComponent(inputValue)}`;
          } else {
            // Par défaut, rechercher dans toutes les musiques
            searchPath = `/musics/all/search?q=${encodeURIComponent(inputValue)}`;
          }
        } else {
          // Default to feed search
          searchPath = `/feed/search?q=${encodeURIComponent(inputValue)}`;
        }

        router.push(searchPath);
      }
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchTerm('');
    
    // Get current path and redirect accordingly
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/musics')) {
      // Rediriger vers la section appropriée
      if (currentPath.includes('/my-musics')) {
        router.push('/musics/my-musics');
      } else if (currentPath.includes('/abonnements')) {
        router.push('/musics/abonnements');
      } else {
        router.push('/musics/all');
      }
    } else {
      router.push('/feed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        autoFocus={autoFocus}
        className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
      />
      {inputValue ? (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
      <button
        type="submit"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
}
