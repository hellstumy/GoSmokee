import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  age: integer("age").notNull(),
  bio: text("bio"),
  interests: text("interests").array(),
  location: json("location").$type<{lat: number, lng: number}>(),
  avatarUrl: text("avatar_url"),
  showOnMap: boolean("show_on_map").default(true),
  maxDistance: integer("max_distance").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invitation model
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  activity: text("activity").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat model
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

// Schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
}).extend({
  age: z.number().min(18, "You must be at least 18 years old to use this app"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Add types for nearby users
export type NearbyUser = User & {
  distance: number;
};
