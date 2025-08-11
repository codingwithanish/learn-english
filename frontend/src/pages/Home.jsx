import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader/AppHeader';
import Card from '../components/Card/Card';
import ModalDetail from '../components/ModalDetail/ModalDetail';
import { textService } from '../services/textService';
import { useAuth } from '../store/authStore';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'search');
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await textService.processText(query);
      
      // Convert process-text result to search result format
      const searchResult = {
        user_id: user?.id,
        type: 'TEXT',
        details: {
          id: result.resource_id,
          type: result.detected_type,
          content: result.corrected_query,
          description: result.description,
          examples: result.examples || [],
          rating: 4, // Default rating
          impressions: 1
        },
        query: result.corrected_query,
        valid: true
      };

      setSearchResults([searchResult]);
      setActiveTab('search');
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const result = await textService.getHistory({ limit: 20 });
      setHistoryItems(result.items || []);
    } catch (error) {
      console.error('History error:', error);
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleFavorite = async (resource) => {
    try {
      await textService.addToFavorites(
        resource.details?.id || resource.id, 
        'text'
      );
      // In a real app, you would update the UI to reflect the favorite status
      console.log('Added to favorites:', resource);
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'search' ? {} : { tab });
    
    if (tab === 'history' && historyItems.length === 0) {
      loadHistory();
    }
  };

  const renderResourceDetails = (resource) => {
    if (!resource) return null;

    const details = resource.details || resource;
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {details.content || resource.query}
          </h3>
          <p className="text-gray-600">
            {details.description}
          </p>
        </div>

        {details.examples && details.examples.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
            <ul className="space-y-1">
              {details.examples.map((example, index) => (
                <li key={index} className="text-gray-600 italic">
                  "{example}"
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Type: {details.type}</span>
          <span>Rating: {details.rating}/5</span>
          <span>Views: {details.impressions}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        showSearch={true}
        onSearch={handleSearch}
        showSpeak={true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Continue learning English with our interactive tools and resources.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search Results
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div>
            {activeTab === 'search' && (
              <div>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map((resource, index) => (
                      <Card
                        key={index}
                        resource={resource}
                        onClick={handleCardClick}
                        onFavorite={handleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 text-gray-400">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      Search for vocabulary, phrases, or grammar
                    </h3>
                    <p className="mt-2 text-gray-500">
                      Use the search bar above to find English learning resources.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {historyItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {historyItems.map((item, index) => (
                      <Card
                        key={index}
                        resource={item}
                        onClick={handleCardClick}
                        onFavorite={handleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 text-gray-400">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No history yet
                    </h3>
                    <p className="mt-2 text-gray-500">
                      Your learning history will appear here as you search and practice.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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