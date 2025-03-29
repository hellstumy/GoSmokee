import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NearbyUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserMarker } from './UserMarker';

interface UserCardProps {
  user: NearbyUser;
  onClose?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClose }) => {
  const { toast } = useToast();
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [activity, setActivity] = useState('');
  const [message, setMessage] = useState('');

  // Mutation for sending an invitation
  const sendInvitation = useMutation({
    mutationFn: async (data: { receiverId: number; activity: string; message?: string }) => {
      return apiRequest('POST', '/api/invitations', data);
    },
    onSuccess: () => {
      toast({
        title: 'Invitation sent',
        description: `You've invited ${user.displayName} to hang out`,
      });
      setIsInvitationModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/sent'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    },
  });

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please specify an activity for your invitation',
        variant: 'destructive',
      });
      return;
    }

    sendInvitation.mutate({
      receiverId: user.id,
      activity: activity.trim(),
      message: message.trim() || undefined,
    });
  };

  return (
    <>
      <Card className="shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <UserMarker
              avatarUrl={user.avatarUrl}
              displayName={user.displayName}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{user.displayName}</h3>
                <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">{user.age}</span>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="mr-1">{user.distance.toFixed(1)} miles away</span>
              </div>
              <p className="mt-2 text-sm">{user.bio || 'Looking to meet new people nearby'}</p>
              {user.interests && user.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {user.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex space-x-2 justify-end">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
          <Button 
            className="bg-primary" 
            onClick={() => setIsInvitationModalOpen(true)}
          >
            Send Invitation
          </Button>
        </CardFooter>
      </Card>

      {/* Send invitation modal */}
      <Dialog open={isInvitationModalOpen} onOpenChange={setIsInvitationModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite {user.displayName}</DialogTitle>
            <DialogDescription>
              Send an invitation to hang out with this person nearby.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvitation} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label htmlFor="activity" className="text-sm font-medium">
                What would you like to do?
              </label>
              <Input
                id="activity"
                placeholder="e.g., Go for a coffee, Take a walk..."
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message (optional)
              </label>
              <Textarea
                id="message"
                placeholder="Add a personal message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsInvitationModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary" disabled={sendInvitation.isPending}>
                {sendInvitation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};