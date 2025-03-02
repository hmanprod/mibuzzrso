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
        // Default behavior: navigate to search page
        router.push(`/feed/search?q=${encodeURIComponent(inputValue)}`);
      }
    }
  };

  const clearSearch = () => {
    // setInputValue('');
    // setSearchTerm('');
    router.push('/feed');
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
