import React, { useState } from 'react';
import AppHeader from '../components/AppHeader/AppHeader';
import EnhancedSearchBar from '../components/SearchBar/EnhancedSearchBar';
import Card from '../components/Card/Card';
import ModalDetail from '../components/ModalDetail/ModalDetail';
import { textService } from '../services/textService';
import { useAuth } from '../store/authStore';
import type { TextResource } from '@/types';

interface SearchResult {
  user_id?: string;
  type: string;
  details: TextResource;
  query: string;
  valid: boolean;
}

const Home: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<SearchResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();

  const handleSearch = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setSearchQuery(query);
    setHasSearched(true);
    
    try {
      const result = await textService.processText(query);
      
      // Convert process-text result to search result format
      const searchResult: SearchResult = {
        user_id: user?.id,
        type: 'TEXT',
        details: {
          id: result.resource.id,
          type: result.analysis.type,
          content: result.resource.content,
          rating: result.resource.rating || 4,
          usage_count: result.resource.usage_count || 1,
          tags: result.resource.tags || [],
          metadata: result.resource.metadata,
          examples: result.resource.examples || [],
          is_favorite: result.resource.is_favorite || false,
          created_at: result.resource.created_at,
          updated_at: result.resource.updated_at,
          difficulty_level: result.resource.difficulty_level || 1
        },
        query: result.resource.content,
        valid: true
      };

      setSearchResults([searchResult]);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (resource: TextResource): void => {
    const searchResult: SearchResult = {
      user_id: user?.id,
      type: 'TEXT',
      details: resource,
      query: resource.content,
      valid: true
    };
    setSelectedResource(searchResult);
    setIsModalOpen(true);
  };

  const handleFavorite = async (resource: TextResource): Promise<void> => {
    try {
      await textService.addToFavorites(resource.id, resource.type);
      console.log('Added to favorites:', resource);
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  const renderResourceDetails = (resource: SearchResult | null): React.ReactNode => {
    if (!resource) return null;

    const details = resource.details;
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {details.content}
          </h3>
          <p className="text-gray-600">
            {details.metadata?.topic || 'No description available'}
          </p>
        </div>

        {details.examples && details.examples.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
            <ul className="space-y-1">
              {details.examples.map((example, index) => (
                <li key={index} className="text-gray-600 italic">
                  "{typeof example === 'string' ? example : example.sentence}"
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Type: {details.type}</span>
          <span>Rating: {details.rating}/5</span>
          <span>Views: {details.usage_count}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="flex flex-col h-screen">
        {/* Search Section - Always visible at top */}
        <div className="bg-white border-b border-gray-200 px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Message - Hidden on mobile to save space */}
            <div className="hidden md:block mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600">
                Continue learning English with our interactive tools and resources.
              </p>
            </div>

            {/* Search Bar */}
            <EnhancedSearchBar 
              onSearch={handleSearch}
              placeholder="Search Vocabulary Phrases and Grammar"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Results Section - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Search Results */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : hasSearched ? (
              <div>
                {/* Search Query Display */}
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Results for "{searchQuery}"
                  </h2>
                  <div className="h-px bg-gray-200"></div>
                </div>

                {/* Results Grid */}
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map((resource, index) => (
                      <Card
                        key={index}
                        resource={resource.details}
                        onClick={handleCardClick}
                        onFavorite={handleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-500">
                      Try searching with different keywords or check your spelling.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Welcome State - Only shown when no search has been performed */
              <div className="text-center py-12 md:py-20">
                <div className="mx-auto h-20 w-20 md:h-24 md:w-24 text-primary-400 mb-6">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                
                {/* Mobile Welcome */}
                <div className="md:hidden">
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Hello, {user?.name?.split(' ')[0]}!
                  </h1>
                  <p className="text-gray-600 mb-8">
                    What would you like to learn today?
                  </p>
                </div>

                {/* Desktop Welcome */}
                <div className="hidden md:block">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Start Learning English
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Search for vocabulary, phrases, and grammar to enhance your English skills, 
                    or practice speaking with our AI-powered tools.
                  </p>
                </div>

                {/* Feature highlights for empty state */}
                <div className="mt-8 md:mt-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div className="text-center p-4">
                      <div className="h-12 w-12 mx-auto text-primary-500 mb-3">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900">Vocabulary</h3>
                      <p className="text-sm text-gray-500 mt-1">Learn new words and meanings</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="h-12 w-12 mx-auto text-primary-500 mb-3">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900">Phrases</h3>
                      <p className="text-sm text-gray-500 mt-1">Master common expressions</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="h-12 w-12 mx-auto text-primary-500 mb-3">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a2 2 0 012-2h2a2 2 0 012 2v3a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900">Grammar</h3>
                      <p className="text-sm text-gray-500 mt-1">Improve sentence structure</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Resource Detail Modal */}
      <ModalDetail
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resource Details"
      >
        {renderResourceDetails(selectedResource)}
      </ModalDetail>
    </div>
  );
};

export default Home;