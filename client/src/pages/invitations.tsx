import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Invitation, User } from '@/lib/types';
import { InvitationItem } from '@/components/invitations/InvitationItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InvitationWithUser extends Invitation {
  otherUser: User;
}

const Invitations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('received');
  
  // Fetch received invitations
  const { 
    data: receivedInvitations,
    isLoading: loadingReceived,
    isError: errorReceived
  } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations/received'],
  });
  
  // Fetch sent invitations
  const { 
    data: sentInvitations,
    isLoading: loadingSent,
    isError: errorSent
  } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations/sent'],
  });
  
  // Fetch all users to get user details for invitations
  const { 
    data: nearbyUsers,
    isLoading: loadingUsers,
    isError: errorUsers
  } = useQuery<User[]>({
    queryKey: ['/api/users/nearby'],
  });
  
  // Get user info for an invitation
  const getUserForInvitation = (invitation: Invitation, isReceived: boolean): User | undefined => {
    if (!nearbyUsers) return undefined;
    
    const userId = isReceived ? invitation.senderId : invitation.receiverId;
    return nearbyUsers.find(user => user.id === userId);
  };
  
  const isLoading = loadingReceived || loadingSent || loadingUsers;
  const isError = errorReceived || errorSent || errorUsers;
  
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load invitations. Please try again.
      </div>
    );
  }
  
  // Count pending received invitations
  const pendingReceived = receivedInvitations
    ? receivedInvitations.filter(inv => inv.status === 'pending').length
    : 0;
  
  // Count pending sent invitations
  const pendingSent = sentInvitations
    ? sentInvitations.filter(inv => inv.status === 'pending').length
    : 0;
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Invitations</h2>
      
      <Tabs defaultValue="received" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="received" className="flex-1">
            Received {pendingReceived > 0 && `(${pendingReceived})`}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1">
            Sent {pendingSent > 0 && `(${pendingSent})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Received Invitations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!receivedInvitations || receivedInvitations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <span className="material-icons text-4xl mb-2">mail</span>
                  <p>No invitations received yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {receivedInvitations.map(invitation => {
                    const otherUser = getUserForInvitation(invitation, true);
                    if (!otherUser) return null;
                    
                    return (
                      <InvitationItem
                        key={invitation.id}
                        invitation={invitation}
                        type="received"
                        otherUser={otherUser}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sent">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Sent Invitations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!sentInvitations || sentInvitations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <span className="material-icons text-4xl mb-2">send</span>
                  <p>No invitations sent yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sentInvitations.map(invitation => {
                    const otherUser = getUserForInvitation(invitation, false);
                    if (!otherUser) return null;
                    
                    return (
                      <InvitationItem
                        key={invitation.id}
                        invitation={invitation}
                        type="sent"
                        otherUser={otherUser}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invitations;
