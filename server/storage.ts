import { 
  users, type User, type InsertUser,
  invitations, type Invitation, type InsertInvitation,
  chats, type Chat, type InsertChat,
  messages, type Message, type InsertMessage
} from "@shared/schema";

// Interface for storage
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getNearbyUsers(userId: number, maxDistance: number): Promise<(User & { distance: number })[]>;
  
  // Invitation operations
  getInvitation(id: number): Promise<Invitation | undefined>;
  getInvitationsBySender(senderId: number): Promise<Invitation[]>;
  getInvitationsByReceiver(receiverId: number): Promise<Invitation[]>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  updateInvitation(id: number, status: string): Promise<Invitation | undefined>;
  
  // Chat operations
  getChat(id: number): Promise<Chat | undefined>;
  getChatByUsers(user1Id: number, user2Id: number): Promise<Chat | undefined>;
  getUserChats(userId: number): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByChat(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(chatId: number, userId: number): Promise<void>;
  getUnreadMessageCount(chatId: number, userId: number): Promise<number>;
}

// Calculate distance between two points in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  // Distance in km
  return R * c;
}

// Convert km to miles
function kmToMiles(km: number): number {
  return km * 0.621371;
}

// Implementation of storage using in-memory maps
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private invitations: Map<number, Invitation>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private invitationIdCounter: number;
  private chatIdCounter: number;
  private messageIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.invitations = new Map();
    this.chats = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.invitationIdCounter = 1;
    this.chatIdCounter = 1;
    this.messageIdCounter = 1;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getNearbyUsers(userId: number, maxDistance: number): Promise<(User & { distance: number })[]> {
    const user = await this.getUser(userId);
    if (!user || !user.location) return [];
    
    const nearbyUsers: (User & { distance: number })[] = [];
    
    for (const otherUser of this.users.values()) {
      if (otherUser.id === userId || !otherUser.showOnMap || !otherUser.location) continue;
      
      const distance = calculateDistance(
        user.location.lat,
        user.location.lng,
        otherUser.location.lat,
        otherUser.location.lng
      );
      
      // Convert km to miles for comparison
      const distanceMiles = kmToMiles(distance);
      
      if (distanceMiles <= maxDistance) {
        nearbyUsers.push({
          ...otherUser,
          distance: parseFloat(distanceMiles.toFixed(1))
        });
      }
    }
    
    // Sort by distance
    return nearbyUsers.sort((a, b) => a.distance - b.distance);
  }
  
  // Invitation operations
  async getInvitation(id: number): Promise<Invitation | undefined> {
    return this.invitations.get(id);
  }
  
  async getInvitationsBySender(senderId: number): Promise<Invitation[]> {
    return Array.from(this.invitations.values())
      .filter(invitation => invitation.senderId === senderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getInvitationsByReceiver(receiverId: number): Promise<Invitation[]> {
    return Array.from(this.invitations.values())
      .filter(invitation => invitation.receiverId === receiverId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const id = this.invitationIdCounter++;
    const createdAt = new Date();
    const invitation: Invitation = { ...insertInvitation, id, createdAt };
    this.invitations.set(id, invitation);
    return invitation;
  }
  
  async updateInvitation(id: number, status: string): Promise<Invitation | undefined> {
    const invitation = await this.getInvitation(id);
    if (!invitation) return undefined;
    
    const updatedInvitation = { ...invitation, status };
    this.invitations.set(id, updatedInvitation);
    return updatedInvitation;
  }
  
  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }
  
  async getChatByUsers(user1Id: number, user2Id: number): Promise<Chat | undefined> {
    return Array.from(this.chats.values()).find(chat => 
      (chat.user1Id === user1Id && chat.user2Id === user2Id) || 
      (chat.user1Id === user2Id && chat.user2Id === user1Id)
    );
  }
  
  async getUserChats(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .filter(chat => chat.user1Id === userId || chat.user2Id === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.chatIdCounter++;
    const createdAt = new Date();
    const chat: Chat = { ...insertChat, id, createdAt };
    this.chats.set(id, chat);
    return chat;
  }
  
  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByChat(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const createdAt = new Date();
    const message: Message = { ...insertMessage, id, createdAt, isRead: false };
    this.messages.set(id, message);
    return message;
  }
  
  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    for (const [id, message] of this.messages.entries()) {
      if (message.chatId === chatId && message.senderId !== userId && !message.isRead) {
        this.messages.set(id, { ...message, isRead: true });
      }
    }
  }
  
  async getUnreadMessageCount(chatId: number, userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId && message.senderId !== userId && !message.isRead)
      .length;
  }
}

// Create and export storage instance
export const storage = new MemStorage();
