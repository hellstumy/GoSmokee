import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { NearbyUser } from '@/lib/types';
import { queryClient } from '@/lib/queryClient';

interface InvitationFormProps {
  receiver: NearbyUser;
  onSuccess: () => void;
}

export const InvitationForm: React.FC<InvitationFormProps> = ({ receiver, onSuccess }) => {
  const { toast } = useToast();
  const [activity, setActivity] = useState('Smoke');
  const [when, setWhen] = useState('Now');
  const [message, setMessage] = useState('Hey! Would you like to join me for a smoke break?');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const activities = ['Coffee', 'Smoke', 'Walk', 'Drinks'];
  const times = ['Now', 'Today', 'Custom'];
  
  const handleSubmit = async () => {
    if (!activity) {
      toast({
        title: 'Error',
        description: 'Please select an activity',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: receiver.id,
          activity,
          message: `${message} (${when})`,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }
      
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/sent'] });
      
      toast({
        title: 'Invitation sent!',
        description: `Your invitation has been sent to ${receiver.displayName}`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-gray-200 dark:bg-gray-700">
          {receiver.avatarUrl ? (
            <img 
              className="w-full h-full object-cover"
              src={receiver.avatarUrl}
              alt={receiver.displayName}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
              <span className="material-icons text-2xl">person</span>
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium">{receiver.displayName}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {receiver.distance} miles away
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
          What would you like to do?
        </label>
        <div className="flex flex-wrap gap-2">
          {activities.map((act) => (
            <Button
              key={act}
              type="button"
              variant="outline"
              className={`rounded-full ${
                activity === act
                  ? 'bg-primary bg-opacity-10 hover:bg-opacity-20 text-primary border-primary'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setActivity(act)}
            >
              {act}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
          When?
        </label>
        <div className="flex space-x-2">
          {times.map((time) => (
            <Button
              key={time}
              type="button"
              variant="outline"
              className={`flex-1 ${
                when === time
                  ? 'bg-primary bg-opacity-10 hover:bg-opacity-20 text-primary border-primary'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setWhen(time)}
            >
              {time}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
          Message
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hey! Would you like to join me for a smoke break?"
          className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 border rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:border-primary"
          rows={3}
        />
      </div>
      
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="flex-1 bg-primary hover:bg-opacity-90 text-white"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Invitation'}
        </Button>
      </div>
    </div>
  );
};
