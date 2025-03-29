import React, { useState, useEffect, useRef } from 'react';
import { UserMarker } from '../users/UserMarker';
import { NearbyUser } from '@/lib/types';
import { Button } from './button';
import { UserCard } from '../users/UserCard';

interface MapProps {
  users: NearbyUser[];
  userLocation?: { lat: number; lng: number };
  onUserSelect: (user: NearbyUser) => void;
  selectedUser?: NearbyUser | null;
}

const Map: React.FC<MapProps> = ({ users, userLocation, onUserSelect, selectedUser }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(15);

  // Mock map rendering - in a real app, we would use a library like React Map GL
  // For this example, we'll use a div with a background image and position the markers relatively
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 20));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 10));
  };
  
  const handleMyLocation = () => {
    // In a real map implementation, this would center the map on the user's location
    if (mapContainerRef.current) {
      mapContainerRef.current.classList.add('pulse-animation');
      setTimeout(() => {
        if (mapContainerRef.current) {
          mapContainerRef.current.classList.remove('pulse-animation');
        }
      }, 500);
    }
  };

  // Generate positions for the users
  // This is a mock implementation - in a real app, we would convert actual coordinates
  const generatePosition = (index: number) => {
    const baseX = 50; // Center X%
    const baseY = 50; // Center Y%
    const angle = (index / users.length) * Math.PI * 2;
    const distance = 20 + (index % 3) * 10; // Distance from center, varied for visual appeal
    
    // Calculate position using polar coordinates
    const x = baseX + distance * Math.cos(angle);
    const y = baseY + distance * Math.sin(angle);
    
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapContainerRef}
        className="h-full w-full bg-cover bg-center transition-all duration-300"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=800&q=80')`,
          transform: `scale(${zoom / 15})`,
        }}
      >
        {/* User markers */}
        {users.map((user, index) => {
          const position = generatePosition(index);
          return (
            <div
              key={user.id}
              className="absolute"
              style={{ 
                top: position.y, 
                left: position.x, 
                transform: 'translate(-50%, -50%)'
              }}
            >
              <UserMarker 
                user={user} 
                isSelected={selectedUser?.id === user.id}
                onClick={() => onUserSelect(user)}
              />
            </div>
          );
        })}
        
        {/* Current user location marker */}
        {userLocation && (
          <div
            className="absolute"
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Map controls */}
      <div className="absolute bottom-20 right-4 z-10 flex flex-col space-y-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg"
          onClick={handleMyLocation}
        >
          <span className="material-icons text-gray-700 dark:text-gray-200">my_location</span>
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg"
          onClick={handleZoomIn}
        >
          <span className="material-icons text-gray-700 dark:text-gray-200">zoom_in</span>
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg"
          onClick={handleZoomOut}
        >
          <span className="material-icons text-gray-700 dark:text-gray-200">zoom_out</span>
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
