import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/use-location';
import { useQuery } from '@tanstack/react-query';
import { NearbyUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { UserList } from '@/components/users/UserList';

const Discover: React.FC = () => {
  const location = useLocation();
  const { toast } = useToast();
  
  // Fetch nearby users
  const { data: nearbyUsers, isLoading, isError, refetch, isFetching } = useQuery<NearbyUser[]>({
    queryKey: ['/api/users/nearby'],
    enabled: !!location.lat && !!location.lng, // Only fetch when location is available
  });
  
  // Handle location errors or loading
  useEffect(() => {
    if (location.error) {
      toast({
        title: 'Location Error',
        description: location.error,
        variant: 'destructive',
      });
    }
  }, [location.error, toast]);
  
  // Refresh nearby users every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (location.lat && location.lng) {
        refetch();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [refetch, location]);
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Discover People</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {location.loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Getting your location...</p>
            </div>
          </div>
        ) : location.error ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <span className="material-icons text-red-500 text-4xl mb-2">location_off</span>
              <h3 className="text-xl font-semibold mb-2">Location Error</h3>
              <p>{location.error}</p>
              <Button 
                className="mt-4 bg-primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Finding people nearby...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <span className="material-icons text-red-500 text-4xl mb-2">error</span>
              <h3 className="text-xl font-semibold mb-2">Error</h3>
              <p>Failed to load nearby users. Please try again.</p>
              <Button 
                className="mt-4 bg-primary"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <UserList 
            users={nearbyUsers || []} 
            onRefresh={refetch} 
            isRefreshing={isFetching} 
          />
        )}
      </div>
    </div>
  );
};

export default Discover;
