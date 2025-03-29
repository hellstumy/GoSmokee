import React from 'react';
import { Message } from '@/lib/types';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  isMine: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMine }) => {
  const formattedTime = format(new Date(message.createdAt), 'h:mm a');
  
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`rounded-lg p-3 max-w-[80%] relative ${
          isMine 
            ? 'bg-primary text-white chat-message-mine rounded-br-none' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 chat-message-other rounded-bl-none'
        }`}
      >
        <p>{message.content}</p>
        <span className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
};
