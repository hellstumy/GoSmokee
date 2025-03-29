import React from 'react';
import { Link, useLocation } from 'wouter';

interface MobileNavigationProps {
  hasNotifications: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ hasNotifications }) => {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="flex justify-around">
        <Link href="/discover"
          className={`flex flex-col items-center p-4 ${location === '/discover' || location === '/' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
          <span className="material-icons">explore</span>
          <span className="text-xs mt-1">Discover</span>
        </Link>
        
        <Link href="/invitations"
          className={`flex flex-col items-center p-4 ${location === '/invitations' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'} relative`}>
          <span className="material-icons">email</span>
          <span className="text-xs mt-1">Invitations</span>
          {hasNotifications && (
            <span className="absolute top-3 right-6 w-5 h-5 flex items-center justify-center bg-primary text-white text-xs rounded-full">
              ●
            </span>
          )}
        </Link>
        
        <Link href="/chats"
          className={`flex flex-col items-center p-4 ${location === '/chats' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
          <span className="material-icons">chat</span>
          <span className="text-xs mt-1">Chats</span>
        </Link>
        
        <Link href="/profile"
          className={`flex flex-col items-center p-4 ${location === '/profile' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
          <span className="material-icons">person</span>
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
};
