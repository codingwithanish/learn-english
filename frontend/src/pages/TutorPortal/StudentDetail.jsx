import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader/AppHeader';
import { tutorService } from '../../services/tutorService';
import { 
  ArrowLeftIcon,
  UserIcon,
  ChartBarIcon,
  ClockIcon,
  BookOpenIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStudentData();
    loadRecommendations();
  }, [id]);

  const loadStudentData = async () => {
    try {
      const data = await tutorService.getStudentDetails(id, {
        limit: 50
      });
      setStudentData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadRecommendations = async () => {
    try {
      const data = await tutorService.getRecommendations(id);
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader showSearch={false} showSpeak={false} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader showSearch={false} showSpeak={false} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error || 'Student not found'}</p>
            <button
              onClick={() => navigate('/tutor')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Students
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { student, statistics, recent_activities, recent_text_resources, recent_speak_resources } = studentData;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showSearch={false} showSpeak={false} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/tutor')}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Students
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-gray-600">{student.user_email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    student.plan === 'PREMIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {student.plan}
                  </span>
                  <span className="text-xs text-gray-500">
                    Joined {formatDate(student.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Profile Information</h3>
            <div className="space-y-2">
              {student.profession && (
                <div>
                  <span className="text-xs text-gray-500">Profession:</span>
                  <p className="text-sm text-gray-900">{student.profession}</p>
                </div>
              )}
              {student.communication_level && (
                <div>
                  <span className="text-xs text-gray-500">English Level:</span>
                  <p className="text-sm text-gray-900">{student.communication_level}</p>
                </div>
              )}
              {student.targetting && (
                <div>
                  <span className="text-xs text-gray-500">Learning Goal:</span>
                  <p className="text-sm text-gray-900">{student.targetting}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Activity Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Text Queries:</span>
                <span className="text-sm font-medium text-gray-900">{statistics.total_text_queries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Speaking Sessions:</span>
                <span className="text-sm font-medium text-gray-900">{statistics.total_speak_sessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Recent Activities:</span>
                <span className="text-sm font-medium text-gray-900">{statistics.recent_activities_count}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Total Activities</h3>
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900 ml-3">{statistics.total_activities}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {['overview', 'activities', 'resources', 'recommendations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Text Resources */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Text Resources</h3>
              {recent_text_resources.length > 0 ? (
                <div className="space-y-3">
                  {recent_text_resources.slice(0, 5).map((resource) => (
                    <div key={resource.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                      <BookOpenIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{resource.content}</p>
                        <p className="text-xs text-gray-500">{resource.type} • {formatDate(resource.created_at)}</p>
                      </div>
                      <span className="text-xs text-yellow-600">{resource.rating}/5</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No text resources yet</p>
              )}
            </div>

            {/* Recent Speaking Sessions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Speaking Sessions</h3>
              {recent_speak_resources.length > 0 ? (
                <div className="space-y-3">
                  {recent_speak_resources.slice(0, 5).map((resource) => (
                    <div key={resource.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                      <MicrophoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                        <p className="text-xs text-gray-500">
                          {resource.type} • {formatDate(resource.created_date)}
                          {resource.completed_date && ` • Completed ${formatDate(resource.completed_date)}`}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        resource.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {resource.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No speaking sessions yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
            </div>
            <div className="p-6">
              {recent_activities.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recent_activities.map((activity, index) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {index !== recent_activities.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.action_type === 'text' ? 'bg-blue-500' : 'bg-green-500'
                              }`}>
                                {activity.action_type === 'text' ? (
                                  <BookOpenIcon className="h-5 w-5 text-white" />
                                ) : (
                                  <MicrophoneIcon className="h-5 w-5 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  <span className="font-medium text-gray-900 capitalize">
                                    {activity.action_type}
                                  </span>{' '}
                                  query: {activity.user_query}
                                </p>
                                {activity.corrected_query && (
                                  <p className="text-sm text-gray-700 mt-1">
                                    Corrected: {activity.corrected_query}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDateTime(activity.action_time)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activities</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            {/* Text Resources */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Text Resources</h3>
              {recent_text_resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recent_text_resources.map((resource) => (
                    <div key={resource.id} className="border border-gray-200 rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resource.type === 'VOCABULARY' ? 'bg-blue-100 text-blue-800' :
                          resource.type === 'PHRASE' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {resource.type}
                        </span>
                        <span className="text-xs text-gray-500">{resource.rating}/5</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{resource.content}</h4>
                      <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(resource.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No text resources yet</p>
              )}
            </div>

            {/* Speaking Resources */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Speaking Sessions</h3>
              {recent_speak_resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recent_speak_resources.map((resource) => (
                    <div key={resource.id} className="border border-gray-200 rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500">{resource.type}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resource.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {resource.status}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{resource.title}</h4>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Created: {formatDate(resource.created_date)}</p>
                        {resource.completed_date && (
                          <p>Completed: {formatDate(resource.completed_date)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No speaking sessions yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Resources</h3>
            {recommendations && recommendations.recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.recommendations.map((rec) => (
                  <div key={rec.id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rec.type === 'VOCABULARY' ? 'bg-blue-100 text-blue-800' :
                        rec.type === 'PHRASE' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {rec.type}
                      </span>
                      <span className="text-xs text-gray-500">{rec.rating}/5</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{rec.content}</h4>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-blue-600">{rec.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recommendations available</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDetail;