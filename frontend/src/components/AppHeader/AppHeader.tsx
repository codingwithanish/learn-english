import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { UserIcon } from '@heroicons/react/24/outline';
import UserMenu from './UserMenu';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

interface Logo {
  src: string;
  alt: string;
}

interface AppHeaderProps {
  logo?: Logo;
  notifications?: Notification[];
}

const AppHeader: React.FC<AppHeaderProps> = ({
  logo = { src: '/logo.svg', alt: 'Learn English' },
  notifications = []
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = (): void => {
    navigate('/profile');
    setIsUserMenuOpen(false);
  };

  const handleAssignmentsClick = (): void => {
    if (user?.type === 'TUTOR' || user?.type === 'ADMIN') {
      navigate('/tutor');
    }
    setIsUserMenuOpen(false);
  };

  const handleHistoryClick = (): void => {
    navigate('/history');
    setIsUserMenuOpen(false);
  };

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const unreadNotifications: number = notifications.filter((n: Notification) => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
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

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center">
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

          {/* Mobile User Menu */}
          <div className="md:hidden">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <UserIcon className="h-6 w-6" />
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
      </div>
    </header>
  );
};

export default AppHeader;