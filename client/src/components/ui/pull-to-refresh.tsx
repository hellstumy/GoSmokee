import React, { useEffect, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState<number | null>(null);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullThreshold = 150; // Минимальное расстояние для вызова обновления
  const maxPull = 200; // Максимальное визуальное расстояние растяжения
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Начинаем отслеживать свайп только если страница прокручена до самого верха
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === null || refreshing || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      // Только если тянем вниз
      if (distance > 0) {
        // Устанавливаем расстояние с уменьшающимся сопротивлением чем дальше тянем
        const dampedDistance = Math.min(
          maxPull,
          distance * 0.5 // Коэффициент сопротивления
        );
        
        setPullDistance(dampedDistance);
        setPulling(true);
        
        // Предотвращаем скроллинг для более плавного взаимодействия
        // Только если у нас идет активное перетягивание
        if (pulling && pullDistance > 10) {
          try {
            e.preventDefault();
          } catch (err) {
            // Игнорируем ошибки preventDefault
            console.log('Cannot preventDefault inside passive event listener');
          }
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;
      
      // Если растянули достаточно - запускаем обновление
      if (pullDistance > pullThreshold && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setRefreshing(false);
        }
      }
      
      setStartY(null);
      setPulling(false);
      setPullDistance(0);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pulling, refreshing, pullDistance, onRefresh]);

  return (
    <div className="relative min-h-screen">
      {/* Индикатор обновления */}
      {(pulling || refreshing) && (
        <div 
          className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 bg-background bg-opacity-75"
          style={{ 
            height: refreshing ? '60px' : `${pullDistance}px`,
            transition: refreshing ? 'none' : 'height 0.2s ease' 
          }}
        >
          <div 
            className={`rounded-full border-t-2 border-r-2 border-primary h-6 w-6 ${refreshing ? 'animate-spin' : ''}`}
            style={{ 
              transform: refreshing ? 'none' : `rotate(${pullDistance * 1.5}deg)`,
              opacity: refreshing ? 1 : Math.min(1, pullDistance / pullThreshold) 
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
};