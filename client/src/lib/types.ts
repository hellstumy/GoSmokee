// Types shared with the server but adapted for client-side use

export interface User {
  id: number;
  username: string;
  displayName: string;
  age: number;
  bio?: string;
  interests?: string[];
  location?: { lat: number, lng: number };
  avatarUrl?: string;
  showOnMap: boolean;
  maxDistance?: number;
  createdAt: Date;
}

export interface NearbyUser extends User {
  distance: number;
}

export interface Invitation {
  id: number;
  senderId: number;
  receiverId: number;
  activity: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface Chat {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt: Date;
}

export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface ChatSummary {
  id: number;
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  displayName: string;
  age: number;
  bio?: string;
  interests?: string[];
}
