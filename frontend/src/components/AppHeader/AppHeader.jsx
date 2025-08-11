import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { MagnifyingGlassIcon, MicrophoneIcon, UserIcon } from '@heroicons/react/24/outline';
import SearchBar from '../SearchBar/SearchBar';
import UserMenu from './UserMenu';

const AppHeader = ({
  logo = { src: '/logo.svg', alt: 'Learn English' },
  showSearch = true,
  onSearch,
  showSpeak = true,
  onSpeakClick,
  notifications = []
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSpeakClick = () => {
    if (onSpeakClick) {
      onSpeakClick();
    } else {
      navigate('/speak');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsUserMenuOpen(false);
  };

  const handleAssignmentsClick = () => {
    if (user?.type === 'TUTOR' || user?.type === 'ADMIN') {
      navigate('/tutor');
    }
    setIsUserMenuOpen(false);
  };

  const handleHistoryClick = () => {
    navigate('/?tab=history');
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              className="h-8 w-auto"
              src={logo.src}
              alt={logo.alt}
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            />
            <span 
              className="ml-2 text-xl font-bold text-primary-600 cursor-pointer"
              onClick={() => navigate('/')}
            >
              Learn English
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search */}
            {showSearch && (
              <div className="relative">
                <SearchBar 
                  onSearch={onSearch}
                  placeholder="Search vocabulary, phrases, grammar..."
                  className="w-96"
                />
              </div>
            )}

            {/* Speak Button */}
            {showSpeak && (
              <button
                onClick={handleSpeakClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <MicrophoneIcon className="h-4 w-4 mr-2" />
                Speak
              </button>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{user?.name}</span>
                  {unreadNotifications > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </div>
              </button>

              <UserMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
                user={user}
                notifications={notifications}
                onProfile={handleProfileClick}
                onAssignments={handleAssignmentsClick}
                onHistory={handleHistoryClick}
                onLogout={handleLogout}
              />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {showSearch && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
            )}
            
            {showSpeak && (
              <button
                onClick={handleSpeakClick}
                className="p-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <MicrophoneIcon className="h-6 w-6" />
              </button>
            )}
            
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <UserIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && showSearch && (
          <div className="md:hidden py-2">
            <SearchBar 
              onSearch={onSearch}
              placeholder="Search vocabulary, phrases, grammar..."
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;