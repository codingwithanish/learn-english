import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader/AppHeader';
import { speakService } from '../services/speakService';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MicrophoneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const SpeakDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await speakService.getSpeakResource(id);
      setResource(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'INITIATED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'INITIATED':
        return <ClockIcon className="h-5 w-5" />;
      default:
        return <MicrophoneIcon className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader showSearch={false} showSpeak={false} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader showSearch={false} showSpeak={false} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/speak')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Speaking
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showSearch={false} showSpeak={false} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/speak')}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Speaking
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {resource?.title || 'Speaking Session'}
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {new Date(resource?.created_date).toLocaleDateString()}
                </div>
                {resource?.completed_date && (
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Completed {new Date(resource.completed_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(resource?.status)}`}>
                {getStatusIcon(resource?.status)}
                <span className="ml-1">{resource?.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          {resource?.summary && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Summary</h2>
              <p className="text-gray-700">{resource.summary}</p>
            </div>
          )}

          {/* Session Configuration */}
          {resource?.resource_config && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Session Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resource.resource_config.subject && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Subject:</span>
                    <p className="text-gray-900">{resource.resource_config.subject}</p>
                  </div>
                )}
                {resource.resource_config.speak_time && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Duration:</span>
                    <p className="text-gray-900">{resource.resource_config.speak_time} seconds</p>
                  </div>
                )}
                {resource.type && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <p className="text-gray-900">{resource.type.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evaluation Results */}
          {resource?.evaluation_result && resource.evaluation_result.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Evaluation Results</h2>
              <div className="space-y-4">
                {resource.evaluation_result.map((result, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4">
                    <h3 className="font-medium text-gray-900 capitalize mb-2">
                      {result.criteria} Assessment
                    </h3>
                    
                    {result.reference_sentence && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-500">Reference:</span>
                        <p className="text-sm text-gray-700">{result.reference_sentence}</p>
                      </div>
                    )}
                    
                    {result.suggestion && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-500">Suggestion:</span>
                        <p className="text-sm text-gray-700">{result.suggestion}</p>
                      </div>
                    )}
                    
                    {result.examples && result.examples.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Examples:</span>
                        <ul className="text-sm text-gray-700 list-disc list-inside ml-2">
                          {result.examples.map((example, idx) => (
                            <li key={idx}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Audio */}
            {resource?.input_resource_location && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Your Recording</h3>
                <div className="text-sm text-gray-500 mb-3">
                  Original audio recording from your speaking session
                </div>
                <audio controls className="w-full">
                  <source src={resource.input_resource_location} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Output Audio (Feedback) */}
            {resource?.output_resource_location && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Feedback Audio</h3>
                <div className="text-sm text-gray-500 mb-3">
                  AI-generated feedback based on your evaluation results
                </div>
                <audio controls className="w-full">
                  <source src={resource.output_resource_location} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>

          {/* Empty state for incomplete sessions */}
          {resource?.status === 'INITIATED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Session Pending
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This speaking session hasn't been completed yet. You can start it from the Speaking page.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SpeakDetail;