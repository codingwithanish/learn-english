import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

const EnhancedSearchBar = ({ 
  onSearch, 
  placeholder = "Search Vocabulary Phrases and Grammar", 
  className = "",
  isLoading = false
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      await onSearch(query.trim());
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSpeakClick = () => {
    navigate('/speak');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile-First Design */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="block w-full px-4 py-4 sm:py-3 text-base sm:text-sm border-2 border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              placeholder={placeholder}
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              </div>
            )}
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-2">
          {/* Search Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !query.trim()}
            className="flex-1 sm:flex-none flex items-center justify-center px-6 py-4 sm:py-3 sm:px-8 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <MagnifyingGlassIcon className="h-5 w-5 sm:mr-2" />
            <span className="sm:inline hidden">SEARCH</span>
          </button>

          {/* Speak Button */}
          <button
            onClick={handleSpeakClick}
            className="flex-1 sm:flex-none flex items-center justify-center px-6 py-4 sm:py-3 sm:px-8 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <MicrophoneIcon className="h-5 w-5 sm:mr-2" />
            <span className="sm:inline hidden">SPEAK</span>
          </button>
        </div>
      </div>

      {/* Mobile Labels (visible only on mobile) */}
      <div className="sm:hidden flex justify-between text-xs text-gray-500 mt-2 px-1">
        <span></span>
        <div className="flex gap-8">
          <span>Search</span>
          <span>Practice</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchBar;