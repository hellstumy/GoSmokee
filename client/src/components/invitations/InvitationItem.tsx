import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Invitation, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format, formatDistanceToNow } from 'date-fns';

interface InvitationItemProps {
  invitation: Invitation;
  type: 'received' | 'sent';
  otherUser: User;
}

export const InvitationItem: React.FC<InvitationItemProps> = ({ invitation, type, otherUser }) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleAccept = async () => {
    setIsUpdating(true);
    try {
      await apiRequest('PATCH', `/api/invitations/${invitation.id}`, { status: 'accepted' });
      
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/received'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      toast({
        title: 'Invitation accepted',
        description: `You can now chat with ${otherUser.displayName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDecline = async () => {
    setIsUpdating(true);
    try {
      await apiRequest('PATCH', `/api/invitations/${invitation.id}`, { status: 'declined' });
      
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/received'] });
      
      toast({
        title: 'Invitation declined',
        description: 'The invitation has been declined',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline invitation',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCancel = async () => {
    setIsUpdating(true);
    try {
      await apiRequest('PATCH', `/api/invitations/${invitation.id}`, { status: 'declined' });
      
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/sent'] });
      
      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const timeAgo = formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true });
  
  return (
    <div className="p-4 flex">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {otherUser.avatarUrl ? (
          <img 
            className="w-full h-full object-cover"
            src={otherUser.avatarUrl}
            alt={otherUser.displayName}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
            <span className="material-icons text-2xl">person</span>
          </div>
        )}
      </div>
      <div className="ml-4 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{otherUser.displayName}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {type === 'received' 
                ? `Wants to have a ${invitation.activity.toLowerCase()}` 
                : `Invited for a ${invitation.activity.toLowerCase()}`}
              {otherUser.distance && ` • ${otherUser.distance} miles away`}
            </p>
            <p className="text-sm mt-1">{invitation.message}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500 dark:text-gray-400">{timeAgo}</span>
            {type === 'sent' && invitation.status === 'pending' && (
              <span className="block mt-1 text-xs text-secondary">Pending</span>
            )}
            {invitation.status === 'accepted' && (
              <span className="block mt-1 text-xs text-green-500">Accepted</span>
            )}
            {invitation.status === 'declined' && (
              <span className="block mt-1 text-xs text-red-500">Declined</span>
            )}
          </div>
        </div>
        
        {type === 'received' && invitation.status === 'pending' && (
          <div className="mt-3 flex space-x-2">
            <Button
              variant="outline"
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
              onClick={handleDecline}
              disabled={isUpdating}
            >
              Decline
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-opacity-90 text-white"
              onClick={handleAccept}
              disabled={isUpdating}
            >
              Accept
            </Button>
          </div>
        )}
        
        {type === 'sent' && invitation.status === 'pending' && (
          <div className="mt-3">
            <Button
              variant="outline"
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel Invitation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
