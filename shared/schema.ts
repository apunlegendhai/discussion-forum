import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  threadsCreated: integer("threads_created").default(0).notNull(),
  commentsPosted: integer("comments_posted").default(0).notNull(),
  upvotesReceived: integer("upvotes_received").default(0).notNull(),
  daysActive: integer("days_active").default(1).notNull(),
  avatar: text("avatar").default("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  colorClass: text("color_class").default("bg-primary"),
  threadCount: integer("thread_count").default(0).notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  colorClass: true,
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
});

// Threads table
export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  votes: integer("votes").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  bookmarkCount: integer("bookmark_count").default(0).notNull(),
});

export const insertThreadSchema = createInsertSchema(threads).pick({
  title: true,
  content: true,
  categoryId: true,
});

// Thread Tags junction table
export const threadTags = pgTable("thread_tags", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const insertThreadTagSchema = createInsertSchema(threadTags).pick({
  threadId: true,
  tagId: true,
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").notNull(),
  threadId: integer("thread_id").notNull(),
  votes: integer("votes").default(0).notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  threadId: true,
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  threadId: integer("thread_id"),
  commentId: integer("comment_id"),
  isUpvote: boolean("is_upvote").notNull(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  threadId: true,
  commentId: true,
  isUpvote: true,
});

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  threadId: integer("thread_id").notNull(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  threadId: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertThread = z.infer<typeof insertThreadSchema>;
export type Thread = typeof threads.$inferSelect;

export type InsertThreadTag = z.infer<typeof insertThreadTagSchema>;
export type ThreadTag = typeof threadTags.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// Extended types for frontend display
export type ThreadWithRelations = Thread & {
  author: User;
  category: Category;
  tags: Tag[];
};

export type CommentWithUser = Comment & {
  author: User;
};
