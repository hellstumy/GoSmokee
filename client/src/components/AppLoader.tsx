import React, { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface AppLoaderProps {
  children: React.ReactNode;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем, был ли предыдущий переход с другой страницы (например, с логина)
    const wasPreviouslyLoaded = sessionStorage.getItem('app_loaded');
    
    if (wasPreviouslyLoaded) {
      // Если приложение уже загружалось ранее, не показываем экран загрузки
      setIsLoading(false);
    } else {
      // Имитируем загрузку ресурсов приложения при первом запуске
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Запоминаем, что приложение уже загружалось
        sessionStorage.setItem('app_loaded', 'true');
      }, 1500); // Время загрузки - 1.5 секунды

      return () => clearTimeout(timer);
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Загрузка GoSmoke..." />;
  }

  return <>{children}</>;
};