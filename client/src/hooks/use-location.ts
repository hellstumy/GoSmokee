import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: true
  });
  const { toast } = useToast();
  
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        ...location,
        error: 'Geolocation is not supported by your browser',
        loading: false
      });
      
      toast({
        title: 'Location Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }
    
    // Watch position to keep location updated
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setLocation({
          lat: latitude,
          lng: longitude,
          error: null,
          loading: false
        });
        
        // Update location on the server
        updateServerLocation(latitude, longitude);
      },
      (error) => {
        let errorMessage = 'Unknown error getting your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Your location is currently unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setLocation({
          lat: null,
          lng: null,
          error: errorMessage,
          loading: false
        });
        
        toast({
          title: 'Location Error',
          description: errorMessage,
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    );
    
    // Cleanup
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);
  
  // Update server with current location
  const updateServerLocation = async (lat: number, lng: number) => {
    try {
      await apiRequest('PATCH', '/api/users/location', { lat, lng });
    } catch (error) {
      console.error('Failed to update location on server:', error);
    }
  };
  
  return location;
}
