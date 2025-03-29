import { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/types';

export function useChat(chatId: number, userId: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener('open', () => {
      setIsConnected(true);
      console.log('Connected to chat server');
      
      // Authenticate with the server
      socket.send(JSON.stringify({
        type: 'auth',
        userId: userId
      }));
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message' && data.message.chatId === chatId) {
          setMessages((prev) => [...prev, data.message]);
        } else if (data.type === 'message_sent' && data.message.chatId === chatId) {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    // Connection closed
    socket.addEventListener('close', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server');
    });
    
    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    });
    
    // Cleanup
    return () => {
      socket.close();
    };
  }, [chatId, userId]);
  
  // Send a message
  const sendMessage = (content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    socketRef.current.send(JSON.stringify({
      type: 'message',
      chatId,
      content
    }));
  };
  
  return {
    messages,
    sendMessage,
    isConnected
  };
}
