import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader/AppHeader';
import { tutorService } from '../../services/tutorService';
import { useAuth } from '../../store/authStore';
import { 
  UserGroupIcon, 
  UserIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const TutorPortal = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await tutorService.getStudents();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentClick = (student) => {
    navigate(`/tutor/student/${student.id}`);
  };

  const getUserTypeColor = (type) => {
    switch (type) {
      case 'PREMIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'FREE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showSearch={false} showSpeak={false} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {user?.type === 'ADMIN' ? 'Admin Dashboard' : 'Tutor Portal'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {user?.type === 'ADMIN' 
              ? 'Manage students and monitor platform activity.'
              : 'Monitor your students\' progress and provide guidance.'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {students.filter(s => s.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">This Month</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {students.filter(s => {
                    const createdAt = new Date(s.created_at);
                    const now = new Date();
                    return createdAt.getMonth() === now.getMonth() && 
                           createdAt.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Students</h2>
          </div>
          
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadStudents}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Try Again
                </button>
              </div>
            ) : students.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentClick(student)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {student.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-1 sm:space-y-2">
                      {student.profession && (
                        <p className="text-xs text-gray-600 truncate">
                          <span className="font-medium">Profession:</span> {student.profession}
                        </p>
                      )}
                      
                      {student.communication_level && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Level:</span> {student.communication_level}
                        </p>
                      )}
                      
                      {student.targetting && (
                        <p className="text-xs text-gray-600 truncate">
                          <span className="font-medium">Goal:</span> {student.targetting}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(student.plan)}`}>
                        {student.plan}
                      </span>
                      
                      <span className="text-xs text-gray-500 truncate">
                        Joined {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No students assigned
                </h3>
                <p className="mt-2 text-gray-500">
                  {user?.type === 'ADMIN' 
                    ? 'No students are registered in the system yet.'
                    : 'You don\'t have any students assigned to you yet.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TutorPortal;