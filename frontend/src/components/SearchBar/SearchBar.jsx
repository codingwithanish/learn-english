import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search...", 
  className = "",
  debounceMs = 300
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useCallback(
    async (searchQuery) => {
      if (!searchQuery.trim() || !onSearch) return;
      
      setIsLoading(true);
      try {
        await onSearch(searchQuery.trim());
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [onSearch]
  );

  useDebounce(debouncedSearch, query, debounceMs);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      await debouncedSearch(query.trim());
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon 
            className={`h-5 w-5 ${isLoading ? 'text-primary-500 animate-pulse' : 'text-gray-400'}`} 
          />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder={placeholder}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;