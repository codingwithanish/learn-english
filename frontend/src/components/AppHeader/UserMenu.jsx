import React, { useRef, useEffect } from 'react';
import { 
  UserIcon, 
  BookOpenIcon, 
  ClockIcon, 
  ArrowRightOnRectangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const UserMenu = ({
  isOpen,
  onClose,
  user,
  notifications = [],
  onProfile,
  onAssignments,
  onHistory,
  onLogout
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5"
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.user_email}</p>
            <p className="text-xs text-primary-600 font-medium">{user?.type}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {unreadNotifications.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <BellIcon className="h-4 w-4 mr-2" />
            Notifications ({unreadNotifications.length})
          </div>
          <div className="max-h-32 overflow-y-auto">
            {unreadNotifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="text-xs text-gray-500 mb-1">
                {notification.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={onProfile}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <UserIcon className="h-4 w-4 mr-3" />
          Profile
        </button>

        {(user?.type === 'TUTOR' || user?.type === 'ADMIN') && (
          <button
            onClick={onAssignments}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <BookOpenIcon className="h-4 w-4 mr-3" />
            {user?.type === 'TUTOR' ? 'My Students' : 'Admin Panel'}
          </button>
        )}

        <button
          onClick={onHistory}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <ClockIcon className="h-4 w-4 mr-3" />
          History
        </button>
      </div>

      {/* Logout */}
      <div className="border-t border-gray-200 py-1">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserMenu;