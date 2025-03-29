import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { dbStorage } from "./dbStorage";
import { 
  insertUserSchema, 
  insertInvitationSchema, 
  insertChatSchema, 
  insertMessageSchema, 
  User
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import session from "express-session";
import memorystore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";

// Add user property to Express Request interface
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

// Simple auth middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await dbStorage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  // Cast to any to allow property assignment
  (req as any).user = user;
  next();
};

// Type WebSocket client with user data
interface UserWebSocket extends WebSocket {
  userId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads/profiles');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Configure multer for file uploads
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${ext}`);
    }
  });
  
  const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      // Accept only images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Setup session
  const MemoryStore = memorystore(session);
  
  app.use(session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'gosmoke-secret-key'
  }));
  
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await dbStorage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const hashedPassword = crypto
        .createHash('sha256')
        .update(userData.password)
        .digest('hex');
      
      // Create user with hashed password
      const user = await dbStorage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await dbStorage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check password
      const hashedPassword = crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
      
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error logging in" });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get('/api/auth/me', authMiddleware, (req, res) => {
    const { password, ...userWithoutPassword } = (req as any).user;
    res.status(200).json(userWithoutPassword);
  });
  
  // User routes
  app.patch('/api/users/profile', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      
      // Update user data
      const updatedUser = await dbStorage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });
  
  // Upload profile photo
  app.post('/api/users/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Get the file path relative to the server
      const avatarUrl = `/uploads/profiles/${file.filename}`;
      
      // Update user with new avatar URL
      const updatedUser = await dbStorage.updateUser(userId, { avatarUrl });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return updated user data
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json({ 
        ...userWithoutPassword,
        message: "Avatar uploaded successfully" 
      });
    } catch (error) {
      res.status(500).json({ message: "Error uploading avatar" });
    }
  });
  
  app.patch('/api/users/location', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { lat, lng } = req.body;
      
      // Validate coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      // Update user location
      const updatedUser = await dbStorage.updateUser(userId, {
        location: { lat, lng }
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ message: "Location updated" });
    } catch (error) {
      res.status(500).json({ message: "Error updating location" });
    }
  });
  
  app.get('/api/users/nearby', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const user = await dbStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.location) {
        return res.status(400).json({ message: "Location not set" });
      }
      
      // Get nearby users
      const maxDistance = user.maxDistance || 5;
      const nearbyUsers = await dbStorage.getNearbyUsers(userId, maxDistance);
      
      // Filter out sensitive data
      const filteredUsers = nearbyUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(filteredUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching nearby users" });
    }
  });
  
  // Invitation routes
  app.post('/api/invitations', authMiddleware, async (req, res) => {
    try {
      const senderId = (req as any).user.id;
      
      // Validate invitation data
      const invitationData = insertInvitationSchema.parse({
        ...req.body,
        senderId
      });
      
      // Create invitation
      const invitation = await dbStorage.createInvitation(invitationData);
      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Error creating invitation" });
    }
  });
  
  app.get('/api/invitations/sent', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const invitations = await dbStorage.getInvitationsBySender(userId);
      res.status(200).json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sent invitations" });
    }
  });
  
  app.get('/api/invitations/received', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const invitations = await dbStorage.getInvitationsByReceiver(userId);
      res.status(200).json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching received invitations" });
    }
  });
  
  app.patch('/api/invitations/:id', authMiddleware, async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const { status } = req.body;
      
      // Validate status
      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get invitation
      const invitation = await dbStorage.getInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if user is the receiver
      if (invitation.receiverId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this invitation" });
      }
      
      // Update invitation
      const updatedInvitation = await dbStorage.updateInvitation(invitationId, status);
      
      // If accepted, create a chat between the two users
      if (status === 'accepted') {
        const existingChat = await dbStorage.getChatByUsers(invitation.senderId, invitation.receiverId);
        
        if (!existingChat) {
          await dbStorage.createChat({
            user1Id: invitation.senderId,
            user2Id: invitation.receiverId
          });
        }
      }
      
      res.status(200).json(updatedInvitation);
    } catch (error) {
      res.status(500).json({ message: "Error updating invitation" });
    }
  });
  
  // Chat routes
  app.get('/api/chats', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      
      // Get all chats
      const chats = await dbStorage.getUserChats(userId);
      
      // Get the other user for each chat and the last message
      const chatDetails = await Promise.all(chats.map(async chat => {
        // Get the other user
        const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
        const otherUser = await dbStorage.getUser(otherUserId);
        
        if (!otherUser) {
          return null;
        }
        
        // Get messages for this chat
        const messages = await dbStorage.getMessagesByChat(chat.id);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        // Get unread message count
        const unreadCount = await dbStorage.getUnreadMessageCount(chat.id, userId);
        
        // Filter out password
        const { password, ...otherUserWithoutPassword } = otherUser;
        
        return {
          id: chat.id,
          otherUser: otherUserWithoutPassword,
          lastMessage,
          unreadCount,
          createdAt: chat.createdAt
        };
      }));
      
      // Filter out nulls and sort by last message time (newest first)
      const validChats = chatDetails.filter((chat): chat is NonNullable<typeof chat> => chat !== null);
      
      // Sort chats by message time or creation time
      validChats.sort((a, b) => {
        // Simple sorting algorithm - most recent chats first
        const aHasMsg = !!a.lastMessage;
        const bHasMsg = !!b.lastMessage;
        
        // Different cases based on message existence
        if (aHasMsg && bHasMsg) {
          // Both have messages, compare message timestamps
          const aTime = a.lastMessage!.createdAt instanceof Date 
            ? a.lastMessage!.createdAt.getTime() 
            : new Date(a.lastMessage!.createdAt as any).getTime();
          
          const bTime = b.lastMessage!.createdAt instanceof Date 
            ? b.lastMessage!.createdAt.getTime() 
            : new Date(b.lastMessage!.createdAt as any).getTime();
          
          return bTime - aTime;
        } else if (aHasMsg && !bHasMsg) {
          // A has message but B doesn't - A is more recent
          return -1;
        } else if (!aHasMsg && bHasMsg) {
          // B has message but A doesn't - B is more recent
          return 1;
        } else {
          // Neither has messages, compare chat creation times
          return new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime();
        }
      });
      
      res.status(200).json(validChats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching chats" });
    }
  });
  
  app.get('/api/chats/:id/messages', authMiddleware, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Get chat
      const chat = await dbStorage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Check if user is part of this chat
      if (chat.user1Id !== userId && chat.user2Id !== userId) {
        return res.status(403).json({ message: "Not authorized to view this chat" });
      }
      
      // Get messages
      const messages = await dbStorage.getMessagesByChat(chatId);
      
      // Mark messages as read
      await dbStorage.markMessagesAsRead(chatId, userId);
      
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws: UserWebSocket) => {
    console.log('WebSocket client connected');
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          const userId = data.userId;
          const user = await dbStorage.getUser(userId);
          
          if (user) {
            ws.userId = userId;
            console.log(`User ${userId} authenticated via WebSocket`);
          }
          return;
        }
        
        // Check if authenticated
        if (!ws.userId) {
          ws.send(JSON.stringify({ error: 'Not authenticated' }));
          return;
        }
        
        // Handle new message
        if (data.type === 'message') {
          const { chatId, content } = data;
          
          // Get chat
          const chat = await dbStorage.getChat(chatId);
          if (!chat) {
            ws.send(JSON.stringify({ error: 'Chat not found' }));
            return;
          }
          
          // Check if user is part of this chat
          if (chat.user1Id !== ws.userId && chat.user2Id !== ws.userId) {
            ws.send(JSON.stringify({ error: 'Not authorized to send messages to this chat' }));
            return;
          }
          
          // Create message
          const message = await dbStorage.createMessage({
            chatId,
            senderId: ws.userId,
            content
          });
          
          // Send message to recipient if online
          const recipientId = chat.user1Id === ws.userId ? chat.user2Id : chat.user1Id;
          wss.clients.forEach((client: UserWebSocket) => {
            if (client.userId === recipientId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'new_message', message }));
            }
          });
          
          // Send confirmation to sender
          ws.send(JSON.stringify({ type: 'message_sent', message }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      console.log(`WebSocket client disconnected. User: ${ws.userId || 'unauthenticated'}`);
    });
  });
  
  return httpServer;
}
