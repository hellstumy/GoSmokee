import fs from 'fs';
import path from 'path';
import { IStorage } from './storage';
import { 
  User, InsertUser, 
  Invitation, InsertInvitation, 
  Chat, InsertChat, 
  Message, InsertMessage 
} from '@shared/schema';

// Путь к файлу для хранения данных
const DB_FILE = path.join(process.cwd(), 'db.json');

// Структура данных
interface DbData {
  users: User[];
  invitations: Invitation[];
  chats: Chat[];
  messages: Message[];
  counters: {
    userId: number;
    invitationId: number;
    chatId: number;
    messageId: number;
  };
}

// Начальное состояние базы данных
const initialData: DbData = {
  users: [],
  invitations: [],
  chats: [],
  messages: [],
  counters: {
    userId: 1,
    invitationId: 1,
    chatId: 1,
    messageId: 1
  }
};

// Функция для расчета расстояния между координатами (в км)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * 
    Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Преобразование км в мили
function kmToMiles(km: number): number {
  return km * 0.621371;
}

export class FileStorage implements IStorage {
  private data: DbData;

  constructor() {
    this.data = this.loadData();
  }

  // Загрузить данные из файла
  private loadData(): DbData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileData = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileData);
      }
    } catch (error) {
      console.error('Error loading data from file:', error);
    }
    
    // Если файл не существует или возникла ошибка, возвращаем начальное состояние
    return { ...initialData };
  }

  // Сохранить данные в файл
  private saveData(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving data to file:', error);
    }
  }

  // Пользователи
  async getUser(id: number): Promise<User | undefined> {
    return this.data.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.data.users.find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.data.counters.userId++;
    const createdAt = new Date();
    
    // Установка отсутствующих полей с корректными типами
    const user: User = {
      ...userData,
      id,
      createdAt,
      bio: userData.bio || null,
      interests: userData.interests || null,
      location: userData.location || null,
      avatarUrl: userData.avatarUrl || null,
      showOnMap: userData.showOnMap ?? true,
      maxDistance: userData.maxDistance || 5
    };
    
    this.data.users.push(user);
    
    this.saveData();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const index = this.data.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    const updatedUser = { ...this.data.users[index], ...userData };
    this.data.users[index] = updatedUser;
    
    this.saveData();
    return updatedUser;
  }

  async getNearbyUsers(userId: number, maxDistance: number): Promise<(User & { distance: number })[]> {
    const user = await this.getUser(userId);
    if (!user || !user.location) return [];
    
    const nearbyUsers = this.data.users
      .filter(otherUser => 
        otherUser.id !== userId && 
        otherUser.showOnMap &&
        otherUser.location
      )
      .map(otherUser => {
        // Рассчитать расстояние
        const distance = kmToMiles(
          calculateDistance(
            user.location!.lat, 
            user.location!.lng,
            otherUser.location!.lat,
            otherUser.location!.lng
          )
        );
        
        return { ...otherUser, distance };
      })
      .filter(otherUser => otherUser.distance <= maxDistance);
    
    return nearbyUsers;
  }

  // Приглашения
  async getInvitation(id: number): Promise<Invitation | undefined> {
    return this.data.invitations.find(invitation => invitation.id === id);
  }

  async getInvitationsBySender(senderId: number): Promise<Invitation[]> {
    return this.data.invitations.filter(invitation => invitation.senderId === senderId);
  }

  async getInvitationsByReceiver(receiverId: number): Promise<Invitation[]> {
    return this.data.invitations.filter(invitation => invitation.receiverId === receiverId);
  }

  async createInvitation(invitationData: InsertInvitation): Promise<Invitation> {
    const id = this.data.counters.invitationId++;
    const createdAt = new Date();
    
    const invitation: Invitation = {
      ...invitationData,
      id,
      createdAt,
      message: invitationData.message || null,
      status: invitationData.status || 'pending'
    };
    
    this.data.invitations.push(invitation);
    
    this.saveData();
    return invitation;
  }

  async updateInvitation(id: number, status: string): Promise<Invitation | undefined> {
    const index = this.data.invitations.findIndex(invitation => invitation.id === id);
    if (index === -1) return undefined;
    
    const updatedInvitation = { ...this.data.invitations[index], status };
    this.data.invitations[index] = updatedInvitation;
    
    this.saveData();
    return updatedInvitation;
  }

  // Чаты
  async getChat(id: number): Promise<Chat | undefined> {
    return this.data.chats.find(chat => chat.id === id);
  }

  async getChatByUsers(user1Id: number, user2Id: number): Promise<Chat | undefined> {
    return this.data.chats.find(chat => 
      (chat.user1Id === user1Id && chat.user2Id === user2Id) ||
      (chat.user1Id === user2Id && chat.user2Id === user1Id)
    );
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return this.data.chats.filter(chat => 
      chat.user1Id === userId || chat.user2Id === userId
    );
  }

  async createChat(chatData: InsertChat): Promise<Chat> {
    const id = this.data.counters.chatId++;
    const createdAt = new Date();
    
    // Создаем чат, явно указывая типы
    const chat: Chat = {
      id,
      user1Id: chatData.user1Id,
      user2Id: chatData.user2Id,
      createdAt
    };
    
    this.data.chats.push(chat);
    
    this.saveData();
    return chat;
  }

  // Сообщения
  async getMessage(id: number): Promise<Message | undefined> {
    return this.data.messages.find(message => message.id === id);
  }

  async getMessagesByChat(chatId: number): Promise<Message[]> {
    return this.data.messages
      .filter(message => message.chatId === chatId)
      .sort((a, b) => {
        // Безопасное преобразование дат
        const aCreatedAt = a.createdAt;
        const bCreatedAt = b.createdAt;
        
        if (!aCreatedAt) return -1;
        if (!bCreatedAt) return 1;
        
        const aTime = aCreatedAt instanceof Date ? 
          aCreatedAt.getTime() : 
          new Date(aCreatedAt).getTime();
        
        const bTime = bCreatedAt instanceof Date ? 
          bCreatedAt.getTime() : 
          new Date(bCreatedAt).getTime();
        
        return aTime - bTime;
      });
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.data.counters.messageId++;
    const createdAt = new Date();
    
    const message: Message = { ...messageData, id, createdAt, isRead: false };
    this.data.messages.push(message);
    
    this.saveData();
    return message;
  }

  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    const messages = this.data.messages.filter(msg => 
      msg.chatId === chatId && msg.senderId !== userId && !msg.isRead
    );
    
    messages.forEach(msg => {
      const index = this.data.messages.findIndex(m => m.id === msg.id);
      if (index !== -1) {
        this.data.messages[index].isRead = true;
      }
    });
    
    if (messages.length > 0) {
      this.saveData();
    }
  }

  async getUnreadMessageCount(chatId: number, userId: number): Promise<number> {
    return this.data.messages.filter(msg => 
      msg.chatId === chatId && msg.senderId !== userId && !msg.isRead
    ).length;
  }
}

export const fileStorage = new FileStorage();