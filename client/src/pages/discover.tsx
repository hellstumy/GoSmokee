import React, { useState, useEffect } from 'react';
import { Map } from '@/components/ui/map';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/use-location';
import { useQuery } from '@tanstack/react-query';
import { NearbyUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const Discover: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const location = useLocation();
  const { toast } = useToast();
  
  // Fetch nearby users
  const { data: nearbyUsers, isLoading, isError, refetch } = useQuery<NearbyUser[]>({
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
  
  const handleUserSelect = (user: NearbyUser) => {
    setSelectedUser(user);
  };
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* View toggle and filters */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            className={viewMode === 'map' ? 'bg-primary text-white' : ''}
            onClick={() => setViewMode('map')}
          >
            Map
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            className={viewMode === 'list' ? 'bg-primary text-white' : ''}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => refetch()}
        >
          <span className="material-icons">filter_list</span>
        </Button>
      </div>
      
      {/* Content based on view mode */}
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
        ) : nearbyUsers && nearbyUsers.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <span className="material-icons text-gray-500 text-4xl mb-2">person_search</span>
              <h3 className="text-xl font-semibold mb-2">No one nearby</h3>
              <p>We couldn't find anyone near you at the moment. Try again later or increase your search radius in your profile settings.</p>
              <Button 
                className="mt-4 bg-primary"
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <Map
            users={nearbyUsers || []}
            userLocation={location.lat && location.lng ? { lat: location.lat, lng: location.lng } : undefined}
            onUserSelect={handleUserSelect}
            selectedUser={selectedUser}
          />
        ) : (
          <div className="p-4 space-y-4">
            {(nearbyUsers || []).map(user => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4 bg-gray-200 dark:bg-gray-700">
                    {user.avatarUrl ? (
                      <img 
                        className="w-full h-full object-cover"
                        src={user.avatarUrl}
                        alt={user.displayName}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <span className="material-icons text-2xl">person</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-semibold">{user.displayName}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{user.age}</span>
                      <span className="ml-auto text-secondary text-sm">{user.distance} miles away</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {user.bio || "Looking to connect with people nearby"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
