import React, { useState } from 'react';
import AppHeader from '../components/AppHeader/AppHeader';
import { useAuth } from '../store/authStore';
import { UserIcon, PencilIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    profession: user?.profession || '',
    communication_level: user?.communication_level || '',
    targetting: user?.targetting || '',
    mobile: user?.mobile || ''
  });

  const handleSave = () => {
    // In a real app, you would save to backend
    console.log('Saving profile data:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      profession: user?.profession || '',
      communication_level: user?.communication_level || '',
      targetting: user?.targetting || '',
      mobile: user?.mobile || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showSearch={false} showSpeak={false} />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-xl font-medium text-gray-900">Profile Settings</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
          </div>

          {/* Profile Picture */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.user_email}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  user?.type === 'TUTOR' ? 'bg-blue-100 text-blue-800' :
                  user?.type === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user?.type}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-700">
                  Profession
                </label>
                <input
                  type="text"
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., Software Engineer, Teacher, Student"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="communication_level" className="block text-sm font-medium text-gray-700">
                  Current English Level
                </label>
                <select
                  id="communication_level"
                  value={formData.communication_level}
                  onChange={(e) => setFormData({ ...formData, communication_level: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select your level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Elementary">Elementary</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Upper Intermediate">Upper Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Proficient">Proficient</option>
                </select>
              </div>

              <div>
                <label htmlFor="targetting" className="block text-sm font-medium text-gray-700">
                  Learning Goals
                </label>
                <select
                  id="targetting"
                  value={formData.targetting}
                  onChange={(e) => setFormData({ ...formData, targetting: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select your goals</option>
                  <option value="Business Communication">Business Communication</option>
                  <option value="Academic English">Academic English</option>
                  <option value="Conversational English">Conversational English</option>
                  <option value="IELTS Preparation">IELTS Preparation</option>
                  <option value="TOEFL Preparation">TOEFL Preparation</option>
                  <option value="General Improvement">General Improvement</option>
                </select>
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+1 234 567 8900"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Account Type:</span>
                <span className="ml-2 text-gray-900">{user?.type}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Plan:</span>
                <span className="ml-2 text-gray-900">{user?.plan}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Status:</span>
                <span className="ml-2 text-gray-900">{user?.status}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Member Since:</span>
                <span className="ml-2 text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;