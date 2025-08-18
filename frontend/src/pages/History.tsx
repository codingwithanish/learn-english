import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader/AppHeader';
import Card from '../components/Card/Card';
import ModalDetail from '../components/ModalDetail/ModalDetail';
import { textService } from '../services/textService';
// import { useAuth } from '../store/authStore';
import { ChevronLeftIcon, ClockIcon } from '@heroicons/react/24/outline';

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, text, speak
  // const { user } = useAuth(); // Currently not used
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const params = { limit: 50 };
      if (filter !== 'all') {
        params.action_type = filter;
      }
      
      const result = await textService.getHistory(params);
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
      console.log('Added to favorites:', resource);
    } catch (error) {
      console.error('Favorite error:', error);
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

  const getFilteredCount = (filterType) => {
    if (filterType === 'all') return historyItems.length;
    return historyItems.filter(item => item.action_type === filterType).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back
            </button>
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Learning History</h1>
            </div>
          </div>
          
          <p className="text-gray-600">
            View your past searches, practice sessions, and learning progress.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Activity
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {historyItems.length}
              </span>
            </button>
            <button
              onClick={() => setFilter('text')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === 'text'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Text Searches
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {getFilteredCount('text')}
              </span>
            </button>
            <button
              onClick={() => setFilter('speak')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === 'speak'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Speaking Practice
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {getFilteredCount('speak')}
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : historyItems.length > 0 ? (
          <div className="space-y-6">
            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyItems
                .filter(item => filter === 'all' || item.action_type === filter)
                .map((item, index) => (
                <Card
                  key={index}
                  resource={item}
                  onClick={handleCardClick}
                  onFavorite={handleFavorite}
                  showTimestamp={true}
                />
              ))}
            </div>

            {/* Load More Button (for future pagination) */}
            {historyItems.length >= 50 && (
              <div className="text-center">
                <button
                  onClick={loadHistory}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto h-20 w-20 text-gray-400 mb-6">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No learning history yet
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Your searches and practice sessions will appear here. Start learning to build your history!
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Start Learning
            </button>
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

export default History;