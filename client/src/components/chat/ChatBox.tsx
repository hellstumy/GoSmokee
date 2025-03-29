import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from './ChatMessage';
import { Message, User } from '@/lib/types';
import { useChat } from '@/hooks/use-chat';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ChatBoxProps {
  chatId: number;
  currentUser: User;
  otherUser: User;
  onBack: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ chatId, currentUser, otherUser, onBack }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { sendMessage, messages, isConnected } = useChat(chatId, currentUser.id);
  
  // Fetch initial messages
  const { data: initialMessages, isLoading } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
  });
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (!isConnected) {
      toast({
        title: 'Connection error',
        description: 'Not connected to chat server. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    sendMessage(message);
    setMessage('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Combine initial messages with real-time messages
  const displayMessages = initialMessages || [];
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={onBack}
        >
          <span className="material-icons">arrow_back</span>
        </Button>
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 dark:bg-gray-700">
          {otherUser.avatarUrl ? (
            <img 
              className="w-full h-full object-cover"
              src={otherUser.avatarUrl}
              alt={otherUser.displayName}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
              <span className="material-icons text-xl">person</span>
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium">{otherUser.displayName}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isConnected ? 'Online' : 'Connecting...'}
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="material-icons text-4xl mb-2">chat</span>
            <p>No messages yet. Send a message to start the conversation!</p>
          </div>
        ) : (
          // Display messages
          displayMessages.map((msg) => (
            <ChatMessage 
              key={msg.id} 
              message={msg}
              isMine={msg.senderId === currentUser.id}
            />
          ))
        )}
        
        {/* Add new real-time messages */}
        {messages.map((msg, index) => (
          <ChatMessage 
            key={`live-${index}`} 
            message={msg}
            isMine={msg.senderId === currentUser.id}
          />
        ))}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Input
            type="text"
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:border-primary dark:text-white"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button 
            className="ml-2 bg-primary text-white rounded-full p-2"
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim() || !isConnected}
          >
            <span className="material-icons">send</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
