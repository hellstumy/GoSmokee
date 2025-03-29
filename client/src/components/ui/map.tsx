import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserMarker } from '../users/UserMarker';
import { NearbyUser } from '@/lib/types';
import { Button } from './button';
import { UserCard } from '../users/UserCard';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';

interface MapProps {
  users: NearbyUser[];
  userLocation?: { lat: number; lng: number };
  onUserSelect: (user: NearbyUser) => void;
  selectedUser?: NearbyUser | null;
}

// Google Maps configuration
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const options = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false
};

const Map: React.FC<MapProps> = ({ users, userLocation, onUserSelect, selectedUser }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });
  
  // Handle Google Maps load
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);
  
  // Handle map unmount
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);
  
  // Map control handlers
  const handleZoomIn = () => {
    if (map) {
      map.setZoom((map.getZoom() || 14) + 1);
    }
  };
  
  const handleZoomOut = () => {
    if (map) {
      map.setZoom((map.getZoom() || 14) - 1);
    }
  };
  
  const handleMyLocation = () => {
    if (map && userLocation) {
      map.panTo(userLocation);
    }
  };

  // Calculate map center based on user location
  const center = userLocation || { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco if no user location
  
  // If the API isn't loaded yet, show a loading state
  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If there was an error loading the API, show an error
  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Error loading Google Maps</p>
          <p className="text-sm text-gray-500">Check your API key or network connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={options}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Current user location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#FF6B6B',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
            }}
          />
        )}
        
        {/* User markers */}
        {users.map((user) => {
          if (!user.location) return null;
          
          return (
            <Marker
              key={user.id}
              position={user.location}
              icon={{
                url: user.avatarUrl || '/assets/default-avatar.svg',
                scaledSize: new google.maps.Size(40, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(20, 20)
              }}
              onClick={() => onUserSelect(user)}
            />
          );
        })}
      </GoogleMap>
      
      {/* Map controls */}
      <div className="absolute bottom-20 right-4 z-10 flex flex-col space-y-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg"
          onClick={handleMyLocation}
        >
          <Navigation className="h-5 w-5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Selected user card */}
      {selectedUser && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-20">
          <UserCard user={selectedUser} />
        </div>
      )}
    </div>
  );
};

export { Map };
