import React, { useRef, useEffect } from 'react';
import { 
  UserIcon, 
  BookOpenIcon, 
  ClockIcon, 
  ArrowRightOnRectangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import type { User } from '@/types';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  notifications?: Notification[];
  onProfile?: () => void;
  onAssignments?: () => void;
  onHistory?: () => void;
  onLogout?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  isOpen,
  onClose,
  user,
  notifications = [],
  onProfile,
  onAssignments,
  onHistory,
  onLogout
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const unreadNotifications: Notification[] = notifications.filter((n: Notification) => !n.read);

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
            <p className="text-xs text-gray-500">{user?.email}</p>
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
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (onProfile) onProfile();
          }}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
        >
          <UserIcon className="h-4 w-4 mr-3" />
          Profile
        </button>

        {(user?.type === 'TUTOR' || user?.type === 'ADMIN') && (
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              if (onAssignments) onAssignments();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
          >
            <BookOpenIcon className="h-4 w-4 mr-3" />
            {user?.type === 'TUTOR' ? 'My Students' : 'Admin Panel'}
          </button>
        )}

        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (onHistory) onHistory();
          }}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
        >
          <ClockIcon className="h-4 w-4 mr-3" />
          History
        </button>
      </div>

      {/* Logout */}
      <div className="border-t border-gray-200 py-1">
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (onLogout) onLogout();
          }}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserMenu;