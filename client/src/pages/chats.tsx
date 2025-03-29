import React, { useState } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatBox } from '@/components/chat/ChatBox';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';

interface ChatSummary {
  id: number;
  otherUser: User;
  lastMessage?: {
    id: number;
    content: string;
    createdAt: Date;
    senderId: number;
  };
  unreadCount: number;
}

const Chats: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  
  // Fetch current user info
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });
  
  // Fetch all chats
  const { data: chats } = useQuery<ChatSummary[]>({
    queryKey: ['/api/chats'],
  });
  
  // Get selected chat details
  const selectedChat = chats?.find(chat => chat.id === selectedChatId);
  
  const handleBackToList = () => {
    setSelectedChatId(null);
  };
  
  if (!currentUser) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="h-full">
      {selectedChatId && selectedChat ? (
        <ChatBox
          chatId={selectedChatId}
          currentUser={currentUser}
          otherUser={selectedChat.otherUser}
          onBack={handleBackToList}
        />
      ) : (
        <div id="chatsList" className="h-full overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Chats</h2>
            <ChatList onChatSelect={(chatId) => setSelectedChatId(chatId)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chats;
