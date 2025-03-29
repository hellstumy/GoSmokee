import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'wouter';

interface ChatListProps {
  onChatSelect?: (chatId: number) => void;
}

interface ChatSummary {
  id: number;
  otherUser: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  lastMessage?: {
    id: number;
    content: string;
    createdAt: Date;
    senderId: number;
  };
  unreadCount: number;
  createdAt: Date;
}

export const ChatList: React.FC<ChatListProps> = ({ onChatSelect }) => {
  const { data: chats, isLoading, isError } = useQuery<ChatSummary[]>({
    queryKey: ['/api/chats'],
  });
  
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load chats. Please try again.
      </div>
    );
  }
  
  if (!chats || chats.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="mb-2">No chats yet</p>
        <p className="text-sm">Accept an invitation to start chatting!</p>
      </div>
    );
  }
  
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    // If the message is from today, show the time
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, 'h:mm a');
    }
    
    // If the message is from yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise, show the date
    return format(messageDate, 'MM/dd/yyyy');
  };
  
  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <div 
          key={chat.id}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onChatSelect && onChatSelect(chat.id)}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {chat.otherUser.avatarUrl ? (
                <img 
                  className="w-full h-full object-cover"
                  src={chat.otherUser.avatarUrl}
                  alt={chat.otherUser.displayName}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <span className="material-icons text-2xl">person</span>
                </div>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex justify-between">
              <h4 className="font-medium">{chat.otherUser.displayName}</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {chat.lastMessage ? formatMessageTime(chat.lastMessage.createdAt) : 'New chat'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate pr-4">
                {chat.lastMessage?.content || 'Start a conversation!'}
              </p>
              {chat.unreadCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-primary text-white text-xs rounded-full">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
