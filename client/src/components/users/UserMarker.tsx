import React from 'react';

interface UserMarkerProps {
  avatarUrl?: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UserMarker: React.FC<UserMarkerProps> = ({ 
  avatarUrl, 
  displayName,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700`}>
      {avatarUrl ? (
        <img 
          className="w-full h-full object-cover"
          src={avatarUrl}
          alt={displayName}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
          <span className="font-semibold">{displayName.charAt(0).toUpperCase()}</span>
        </div>
      )}
    </div>
  );
};