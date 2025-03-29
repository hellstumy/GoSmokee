import React from 'react';
import { User } from '@/lib/types';

interface UserMarkerProps {
  user: User;
  isSelected: boolean;
  onClick: () => void;
}

export const UserMarker: React.FC<UserMarkerProps> = ({ user, isSelected, onClick }) => {
  return (
    <div 
      className="relative cursor-pointer transform transition-transform duration-200 hover:scale-110"
      onClick={onClick}
    >
      <div 
        className={`w-12 h-12 rounded-full p-1 shadow-lg ${
          isSelected 
            ? 'bg-primary bg-opacity-20 border-2 border-primary' 
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        }`}
      >
        {user.avatarUrl ? (
          <img 
            className="w-full h-full rounded-full object-cover"
            src={user.avatarUrl}
            alt={user.username}
          />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            <span className="material-icons text-lg">person</span>
          </div>
        )}
      </div>
      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
    </div>
  );
};
