import React from 'react';
import { Link, useLocation } from 'wouter';

interface SidebarProps {
  hasNotifications: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ hasNotifications, toggleDarkMode }) => {
  const [location] = useLocation();
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <span className="text-primary text-xl font-semibold">GoSmoke</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/discover" 
              className={`flex items-center p-3 rounded-lg ${
                location === '/discover' || location === '/' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <span className="material-icons mr-3">explore</span>
              <span>Discover</span>
            </Link>
          </li>
          <li>
            <Link href="/invitations" 
              className={`flex items-center p-3 rounded-lg ${
                location === '/invitations' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <span className="material-icons mr-3">email</span>
              <span>Invitations</span>
              {hasNotifications && (
                <span className="ml-auto bg-primary text-white text-xs rounded-full px-2 py-1">New</span>
              )}
            </Link>
          </li>
          <li>
            <Link href="/chats" 
              className={`flex items-center p-3 rounded-lg ${
                location === '/chats' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <span className="material-icons mr-3">chat</span>
              <span>Chats</span>
            </Link>
          </li>
          <li>
            <Link href="/profile" 
              className={`flex items-center p-3 rounded-lg ${
                location === '/profile' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <span className="material-icons mr-3">person</span>
              <span>Profile</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full p-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <div className="flex items-center">
            <span className="material-icons mr-3">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </button>
      </div>
    </aside>
  );
};
