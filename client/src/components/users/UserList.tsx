import React, { useState } from 'react';
import { NearbyUser } from '@/lib/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UserCard } from './UserCard';
import { UserMarker } from './UserMarker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw, Users } from 'lucide-react';

interface UserListProps {
  users: NearbyUser[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const UserList: React.FC<UserListProps> = ({ users, onRefresh, isRefreshing }) => {
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1 px-3 py-1">
            <Users className="h-3 w-3" />
            <span>{users.length} nearby</span>
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center space-x-1"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
      
      {users.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto bg-gray-100 dark:bg-gray-800 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-1">No one nearby</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            We couldn't find anyone near you right now. Try again later or increase your search distance in settings.
          </p>
          <Button onClick={onRefresh} disabled={isRefreshing} className="bg-primary">
            {isRefreshing ? 'Refreshing...' : 'Try Again'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(user => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 cursor-pointer transition-all hover:shadow-md"
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex items-center">
                <div className="mr-4">
                  <UserMarker 
                    avatarUrl={user.avatarUrl}
                    displayName={user.displayName}
                    size="md"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{user.displayName}</h3>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{user.age}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{user.distance.toFixed(1)} miles away</span>
                  </div>
                  <p className="text-sm mt-1 truncate">
                    {user.bio ? user.bio : 'Looking to connect with people nearby'}
                  </p>
                </div>
              </div>
              
              {user.interests && user.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {user.interests.slice(0, 3).map((interest, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                  {user.interests.length > 3 && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full">
                      +{user.interests.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* User details dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedUser && (
            <UserCard 
              user={selectedUser} 
              onClose={() => setSelectedUser(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};