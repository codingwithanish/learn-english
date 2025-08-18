import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader/AppHeader';
import SpeakSession from '../components/Speak/SpeakSession';
import ModalDetail from '../components/ModalDetail/ModalDetail';
import { speakService } from '../services/speakService';
import { 
  MicrophoneIcon, 
  ClockIcon, 
  CheckCircleIcon,
  PlayIcon 
} from '@heroicons/react/24/outline';

const Speak = () => {
  const [activeTab, setActiveTab] = useState('start');
  const [speakResources, setSpeakResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionConfig, setSessionConfig] = useState({});
  const navigate = useNavigate();

  // Form state for new session
  const [subject, setSubject] = useState('');
  const [speakTime, setSpeakTime] = useState(60);
  const [sessionType, setSessionType] = useState('SUBJECT_SPEAK');

  useEffect(() => {
    loadSpeakResources();
  }, []);

  const loadSpeakResources = async () => {
    setIsLoading(true);
    try {
      const resources = await speakService.getSpeakResources();
      setSpeakResources(resources);
    } catch (error) {
      console.error('Failed to load speak resources:', error);
      setSpeakResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = () => {
    if (!subject.trim()) {
      alert('Please enter a subject to speak about');
      return;
    }

    const config = {
      subject: subject.trim(),
      speak_time: speakTime,
      type: sessionType
    };

    setSessionConfig(config);
    setShowSessionModal(true);
  };

  const handleSessionComplete = (result) => {
    setShowSessionModal(false);
    loadSpeakResources(); // Reload to show new resource
    
    // Navigate to the new resource detail page
    if (result.resource_id) {
      navigate(`/speak/${result.resource_id}`);
    }
  };

  const handleSessionError = (error) => {
    console.error('Session error:', error);
    alert('Session error: ' + error.message);
  };

  const handleResourceClick = (resource) => {
    navigate(`/speak/${resource.id}`);
  };

  const getResourceIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'INITIATED':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <MicrophoneIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getResourceStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'INITIATED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStartSession = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-medium text-gray-900">Start New Speaking Session</h2>
      </div>
      
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject or Topic
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., My daily routine, Travel experiences..."
          />
        </div>

        <div>
          <label htmlFor="speakTime" className="block text-sm font-medium text-gray-700 mb-2">
            Speaking Duration
          </label>
          <select
            id="speakTime"
            value={speakTime}
            onChange={(e) => setSpeakTime(parseInt(e.target.value))}
            className="w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={90}>1.5 minutes</option>
            <option value={120}>2 minutes</option>
            <option value={180}>3 minutes</option>
          </select>
        </div>

        <div>
          <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-2">
            Session Type
          </label>
          <select
            id="sessionType"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="SUBJECT_SPEAK">Subject Speaking</option>
            <option value="CONVERSATION">Conversation Practice</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            onClick={handleStartSession}
            className="w-full inline-flex justify-center items-center px-6 py-4 sm:py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <MicrophoneIcon className="h-5 w-5 mr-2" />
            Start Speaking Session
          </button>
        </div>
      </div>
    </div>
  );

  const renderSpeakResources = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : speakResources.length > 0 ? (
        speakResources.map((resource) => (
          <div
            key={resource.id}
            onClick={() => handleResourceClick(resource)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {getResourceIcon(resource.status)}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {resource.title || 'Speaking Session'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(resource.created_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResourceStatusColor(resource.status)}`}>
                  {resource.status}
                </span>
                
                {resource.status === 'INITIATED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Start session for this resource
                      const config = resource.resource_config || {};
                      setSessionConfig(config);
                      setShowSessionModal(true);
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100"
                  >
                    <PlayIcon className="h-3 w-3 mr-1" />
                    Start
                  </button>
                )}
              </div>
            </div>
            
            {resource.summary && (
              <p className="mt-2 text-sm text-gray-600">
                {resource.summary}
              </p>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <MicrophoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No speaking sessions yet
          </h3>
          <p className="mt-2 text-gray-500">
            Start your first speaking session to begin practicing your English.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showSearch={false} showSpeak={false} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Speaking Practice
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Practice your English speaking skills with real-time feedback and evaluation.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('start')}
              className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'start'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Start Session
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'sessions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Sessions ({speakResources.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'start' && renderStartSession()}
        {activeTab === 'sessions' && renderSpeakResources()}

        {/* Speaking Session Modal */}
        <ModalDetail
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title="Speaking Session"
          size="lg"
        >
          <SpeakSession
            config={sessionConfig}
            onSessionComplete={handleSessionComplete}
            onError={handleSessionError}
            autoStart={true}
          />
        </ModalDetail>
      </main>
    </div>
  );
};

export default Speak;