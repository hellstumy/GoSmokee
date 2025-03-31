import React, { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface AppLoaderProps {
  children: React.ReactNode;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Имитируем загрузку ресурсов приложения
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Время загрузки - 1.5 секунды

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Загрузка GoSmoke..." />;
  }

  return <>{children}</>;
};