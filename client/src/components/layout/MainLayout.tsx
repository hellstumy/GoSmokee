import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { useLocation, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [pageTitle, setPageTitle] = useState('Discover');
  const { toast } = useToast();
  const [hasNotifications, setHasNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Функция проверки уведомлений
  const checkNotifications = async () => {
    try {
      const response = await fetch('/api/invitations/received');
      const invitations = await response.json();
      
      // Check if there are any pending invitations
      const pendingInvitations = invitations.filter((inv: any) => inv.status === 'pending');
      setHasNotifications(pendingInvitations.length > 0);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };
  
  // Функция обновления данных
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Обновить местоположение пользователя, если имеется доступ
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await fetch('/api/users/location', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                })
              });
            } catch (error) {
              console.error('Failed to update location on server:', error);
            }
          },
          (error) => console.error('Error getting location:', error),
          { enableHighAccuracy: true }
        );
      }
      
      // Проверить уведомления
      await checkNotifications();
      
      toast({
        title: 'Обновлено',
        description: 'Данные успешно обновлены',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error during refresh:', error);
      toast({
        title: 'Ошибка при обновлении',
        description: 'Пожалуйста, попробуйте снова',
        variant: 'destructive',
        duration: 2000,
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  // Check for notifications
  useEffect(() => {
    checkNotifications();
    // Poll every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Update page title based on location
  useEffect(() => {
    let title = 'Discover';
    if (location.includes('/invitations')) title = 'Invitations';
    else if (location.includes('/chats')) title = 'Chats';
    else if (location.includes('/profile')) title = 'Profile';
    
    setPageTitle(title);
  }, [location]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark ? 'light' : 'dark');
    
    toast({
      title: isDark ? 'Light Mode Activated' : 'Dark Mode Activated',
      description: isDark ? 'Switched to light theme' : 'Switched to dark theme',
      duration: 2000,
    });
  };
  
  // Check if dark mode is already set
  useEffect(() => {
    if (
      localStorage.getItem('darkMode') === 'dark' ||
      (localStorage.getItem('darkMode') === null &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col h-screen md:flex-row bg-lightBg text-lightText dark:bg-darkBg dark:text-darkText">
        {/* Mobile header */}
        <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-primary text-xl font-semibold">GoSmoke</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/invitations">
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative"
              >
                <span className="material-icons">notifications</span>
                {hasNotifications && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="material-icons">
                {document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </header>
        
        {/* Sidebar for desktop */}
        <Sidebar 
          hasNotifications={hasNotifications}
          toggleDarkMode={toggleDarkMode}
        />
        
        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
        
        {/* Mobile navigation */}
        <MobileNavigation hasNotifications={hasNotifications} />
      </div>
    </PullToRefresh>
  );
};
