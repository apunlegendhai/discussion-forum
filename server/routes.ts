import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertThreadSchema, insertCommentSchema, insertVoteSchema, insertBookmarkSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Error handler for Zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Unexpected error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  };

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ message: 'Error fetching categories' });
    }
  });

  // Tag routes
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (err) {
      console.error('Error fetching tags:', err);
      res.status(500).json({ message: 'Error fetching tags' });
    }
  });

  // Thread routes
  app.get("/api/threads", async (req, res) => {
    try {
      const filter = req.query.filter as string || 'latest';
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      
      const threads = await storage.getThreads(filter, categoryId, page, limit);
      res.json(threads);
    } catch (err) {
      console.error('Error fetching threads:', err);
      res.status(500).json({ message: 'Error fetching threads' });
    }
  });

  app.get("/api/threads/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const thread = await storage.getThread(id);
      
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      // Increment view count
      await storage.incrementThreadStats(id, 'viewCount');
      
      res.json(thread);
    } catch (err) {
      console.error('Error fetching thread:', err);
      res.status(500).json({ message: 'Error fetching thread' });
    }
  });

  app.post("/api/threads", isAuthenticated, async (req, res) => {
    try {
      const parsedBody = insertThreadSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return handleZodError(parsedBody.error, res);
      }
      
      const { title, content, categoryId } = parsedBody.data;
      const tagNames = req.body.tags || [];
      
      const newThread = await storage.createThread(
        { title, content, categoryId },
        req.user!.id,
        tagNames
      );
      
      res.status(201).json(newThread);
    } catch (err) {
      console.error('Error creating thread:', err);
      res.status(500).json({ message: 'Error creating thread' });
    }
  });

  // Comment routes
  app.get("/api/threads/:threadId/comments", async (req, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const comments = await storage.getComments(threadId);
      res.json(comments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      res.status(500).json({ message: 'Error fetching comments' });
    }
  });

  app.post("/api/threads/:threadId/comments", isAuthenticated, async (req, res) => {
    try {
      const threadId = Number(req.params.threadId);
      
      const parsedBody = insertCommentSchema.safeParse({
        ...req.body,
        threadId
      });
      
      if (!parsedBody.success) {
        return handleZodError(parsedBody.error, res);
      }
      
      const newComment = await storage.createComment(
        parsedBody.data,
        req.user!.id
      );
      
      res.status(201).json(newComment);
    } catch (err) {
      console.error('Error creating comment:', err);
      res.status(500).json({ message: 'Error creating comment' });
    }
  });

  // Vote routes
  app.post("/api/vote", isAuthenticated, async (req, res) => {
    try {
      const parsedBody = insertVoteSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return handleZodError(parsedBody.error, res);
      }
      
      const { threadId, commentId, isUpvote } = parsedBody.data;
      
      // Check if user already voted on this thread/comment
      const existingVote = await storage.getVote(req.user!.id, threadId || undefined, commentId || undefined);
      
      if (existingVote) {
        // If vote is the same, remove it (toggle off)
        if (existingVote.isUpvote === isUpvote) {
          await storage.deleteVote(existingVote.id);
          return res.status(200).json({ message: 'Vote removed' });
        }
        
        // Otherwise update the vote (toggle between upvote/downvote)
        const updatedVote = await storage.updateVote(existingVote.id, isUpvote);
        return res.status(200).json(updatedVote);
      }
      
      // Create new vote
      const newVote = await storage.createVote(
        { threadId, commentId, isUpvote },
        req.user!.id
      );
      
      res.status(201).json(newVote);
    } catch (err) {
      console.error('Error handling vote:', err);
      res.status(500).json({ message: 'Error handling vote' });
    }
  });

  // Bookmark routes
  app.post("/api/bookmarks", isAuthenticated, async (req, res) => {
    try {
      const parsedBody = insertBookmarkSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return handleZodError(parsedBody.error, res);
      }
      
      const { threadId } = parsedBody.data;
      
      // Check if user already bookmarked this thread
      const existingBookmark = await storage.getBookmark(req.user!.id, threadId);
      
      if (existingBookmark) {
        // Toggle off if already exists
        await storage.deleteBookmark(existingBookmark.id);
        return res.status(200).json({ message: 'Bookmark removed' });
      }
      
      // Create new bookmark
      const newBookmark = await storage.createBookmark(
        { threadId },
        req.user!.id
      );
      
      res.status(201).json(newBookmark);
    } catch (err) {
      console.error('Error handling bookmark:', err);
      res.status(500).json({ message: 'Error handling bookmark' });
    }
  });

  // Trending threads route
  app.get("/api/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 3;
      const trendingThreads = await storage.getTrendingThreads(limit);
      res.json(trendingThreads);
    } catch (err) {
      console.error('Error fetching trending threads:', err);
      res.status(500).json({ message: 'Error fetching trending threads' });
    }
  });

  // Community stats route
  app.get("/api/community-stats", async (req, res) => {
    try {
      const stats = await storage.getCommunityStats();
      res.json(stats);
    } catch (err) {
      console.error('Error fetching community stats:', err);
      res.status(500).json({ message: 'Error fetching community stats' });
    }
  });

  // User stats route
  app.get("/api/user-stats", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const userStats = {
        threadsCreated: user.threadsCreated,
        commentsPosted: user.commentsPosted,
        upvotesReceived: user.upvotesReceived,
        daysActive: user.daysActive
      };
      
      res.json(userStats);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      res.status(500).json({ message: 'Error fetching user stats' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
