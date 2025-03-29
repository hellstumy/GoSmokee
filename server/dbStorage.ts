import crypto from 'crypto';
import { 
  users, 
  invitations, 
  chats, 
  messages, 
  User, 
  InsertUser, 
  Invitation,
  InsertInvitation,
  Chat,
  InsertChat,
  Message,
  InsertMessage
} from '@shared/schema';
import { IStorage } from './storage';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from './db';

// Function to calculate distance between two points on Earth
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

// PostgreSQL database storage implementation
export class DbStorage implements IStorage {
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password before storing
    if (userData.password) {
      userData.password = crypto.createHash('sha256').update(userData.password).digest('hex');
    }
    
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getNearbyUsers(userId: number, maxDistance: number): Promise<(User & { distance: number })[]> {
    // First, get the current user to get their location
    const user = await this.getUser(userId);
    if (!user || !user.location) return [];
    
    // Get all users except the current one
    const otherUsers = await db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.id} <> ${userId}`,
          sql`${users.showOnMap} = true`,
          sql`${users.location} IS NOT NULL`
        )
      );
    
    // Calculate distances and filter by maxDistance
    const nearbyUsers = otherUsers
      .filter(otherUser => otherUser.location) // Make sure location is not null
      .map(otherUser => {
        const distance = calculateDistance(
          user.location!.lat,
          user.location!.lng,
          otherUser.location!.lat,
          otherUser.location!.lng
        );
        
        const distanceMiles = kmToMiles(distance);
        
        return {
          ...otherUser,
          distance: parseFloat(distanceMiles.toFixed(1))
        };
      })
      .filter(user => user.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
    
    return nearbyUsers;
  }
  
  // Invitation operations
  async getInvitation(id: number): Promise<Invitation | undefined> {
    const result = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getInvitationsBySender(senderId: number): Promise<Invitation[]> {
    return await db
      .select()
      .from(invitations)
      .where(eq(invitations.senderId, senderId))
      .orderBy(desc(invitations.createdAt));
  }
  
  async getInvitationsByReceiver(receiverId: number): Promise<Invitation[]> {
    return await db
      .select()
      .from(invitations)
      .where(eq(invitations.receiverId, receiverId))
      .orderBy(desc(invitations.createdAt));
  }
  
  async createInvitation(invitationData: InsertInvitation): Promise<Invitation> {
    const result = await db
      .insert(invitations)
      .values(invitationData)
      .returning();
    
    return result[0];
  }
  
  async updateInvitation(id: number, status: string): Promise<Invitation | undefined> {
    const result = await db
      .update(invitations)
      .set({ status })
      .where(eq(invitations.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    const result = await db
      .select()
      .from(chats)
      .where(eq(chats.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getChatByUsers(user1Id: number, user2Id: number): Promise<Chat | undefined> {
    const result = await db
      .select()
      .from(chats)
      .where(
        or(
          and(
            eq(chats.user1Id, user1Id),
            eq(chats.user2Id, user2Id)
          ),
          and(
            eq(chats.user1Id, user2Id),
            eq(chats.user2Id, user1Id)
          )
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserChats(userId: number): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(
        or(
          eq(chats.user1Id, userId),
          eq(chats.user2Id, userId)
        )
      );
  }
  
  async createChat(chatData: InsertChat): Promise<Chat> {
    const result = await db
      .insert(chats)
      .values(chatData)
      .returning();
    
    return result[0];
  }
  
  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getMessagesByChat(chatId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values(messageData)
      .returning();
    
    return result[0];
  }
  
  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.chatId, chatId),
          sql`${messages.senderId} <> ${userId}`,
          sql`${messages.isRead} = false`
        )
      );
  }
  
  async getUnreadMessageCount(chatId: number, userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          sql`${messages.senderId} <> ${userId}`,
          sql`${messages.isRead} = false`
        )
      );
    
    return result[0].count ?? 0;
  }
}

// Create and export a singleton instance
export const dbStorage = new DbStorage();