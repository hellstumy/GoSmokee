import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvitationForm } from '../invitations/InvitationForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { NearbyUser } from '@/lib/types';

interface UserCardProps {
  user: NearbyUser;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const [open, setOpen] = useState(false);
  
  // Sample interest tags - in a real app, these would come from the user data
  const interestTags = user.interests || ['Coffee', 'Cigarettes', 'Evening'];
  
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="w-16 h-16 rounded-full overflow-hidden mr-4 bg-gray-200 dark:bg-gray-700">
            {user.avatarUrl ? (
              <img 
                className="w-full h-full object-cover"
                src={user.avatarUrl}
                alt={user.displayName}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <span className="material-icons text-3xl">person</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {user.displayName} <span className="text-gray-500 dark:text-gray-400 text-sm">{user.age}</span>
              </h3>
              <span className="text-secondary text-sm">{user.distance} miles away</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              {user.bio || "Looking for someone to join for a smoke 🚬"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {interestTags.map((tag, index) => (
                <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1"
          >
            View Profile
          </Button>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-primary">
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <InvitationForm 
                receiver={user} 
                onSuccess={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
};
