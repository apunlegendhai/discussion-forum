import {
  users, categories, tags, threads, threadTags, comments, votes, bookmarks,
  type User, type InsertUser, type Category, type InsertCategory,
  type Tag, type InsertTag, type Thread, type InsertThread,
  type ThreadTag, type InsertThreadTag, type Comment, type InsertComment,
  type Vote, type InsertVote, type Bookmark, type InsertBookmark,
  type ThreadWithRelations, type CommentWithUser
} from "@shared/schema";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";

const SQLiteStoreSession = SQLiteStore(session);
export const sessionStore = new SQLiteStoreSession({
  db: "sessions.db",
  dir: "./server/db",
});

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(userId: number, stats: Partial<Omit<User, 'id' | 'username' | 'password' | 'createdAt' | 'avatar'>>): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  incrementCategoryThreadCount(categoryId: number): Promise<Category>;

  // Tag methods
  getTags(): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  getTagByName(name: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;

  // Thread methods
  getThreads(filter?: string, categoryId?: number, page?: number, limit?: number): Promise<ThreadWithRelations[]>;
  getThread(id: number): Promise<ThreadWithRelations | undefined>;
  createThread(thread: InsertThread, userId: number, tagNames: string[]): Promise<ThreadWithRelations>;
  incrementThreadStats(threadId: number, field: 'viewCount' | 'commentCount' | 'bookmarkCount', amount?: number): Promise<Thread>;
  updateThreadVotes(threadId: number, amount: number): Promise<Thread>;
  getTrendingThreads(limit?: number): Promise<ThreadWithRelations[]>;

  // Thread Tags methods
  getThreadTags(threadId: number): Promise<Tag[]>;
  addThreadTag(threadTag: InsertThreadTag): Promise<ThreadTag>;

  // Comment methods
  getComments(threadId: number): Promise<CommentWithUser[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment, userId: number): Promise<Comment>;
  updateCommentVotes(commentId: number, amount: number): Promise<Comment>;

  // Vote methods
  getVote(userId: number, threadId?: number, commentId?: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote, userId: number): Promise<Vote>;
  updateVote(id: number, isUpvote: boolean): Promise<Vote>;
  deleteVote(id: number): Promise<void>;

  // Bookmark methods
  getBookmark(userId: number, threadId: number): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark, userId: number): Promise<Bookmark>;
  deleteBookmark(id: number): Promise<void>;

  // Community stats
  getCommunityStats(): Promise<{
    memberCount: number;
    threadCount: number;
    commentCount: number;
    onlineCount: number;
  }>;

  // Session store
  sessionStore: SQLiteStoreSession;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private tags: Map<number, Tag>;
  private threads: Map<number, Thread>;
  private threadTags: Map<number, ThreadTag>;
  private comments: Map<number, Comment>;
  private votes: Map<number, Vote>;
  private bookmarks: Map<number, Bookmark>;

  private userIdCounter: number;
  private categoryIdCounter: number;
  private tagIdCounter: number;
  private threadIdCounter: number;
  private threadTagIdCounter: number;
  private commentIdCounter: number;
  private voteIdCounter: number;
  private bookmarkIdCounter: number;

  // The session store instance
  sessionStore: SQLiteStoreSession;

  constructor() {
    // Initialize maps
    this.users = new Map();
    this.categories = new Map();
    this.tags = new Map();
    this.threads = new Map();
    this.threadTags = new Map();
    this.comments = new Map();
    this.votes = new Map();
    this.bookmarks = new Map();

    // Initialize ID counters
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.tagIdCounter = 1;
    this.threadIdCounter = 1;
    this.threadTagIdCounter = 1;
    this.commentIdCounter = 1;
    this.voteIdCounter = 1;
    this.bookmarkIdCounter = 1;

    // Initialize session store
    this.sessionStore = sessionStore;

    // Seed initial categories
    this.seedCategories();
    // Seed initial tags
    this.seedTags();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const currentDate = new Date();
    const user: User = {
      ...insertUser,
      id,
      createdAt: currentDate,
      threadsCreated: 0,
      commentsPosted: 0,
      upvotesReceived: 0,
      daysActive: 1,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStats(userId: number, stats: Partial<Omit<User, 'id' | 'username' | 'password' | 'createdAt' | 'avatar'>>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const updatedUser: User = {
      ...user,
      ...stats
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id, threadCount: 0 };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async incrementCategoryThreadCount(categoryId: number): Promise<Category> {
    const category = await this.getCategory(categoryId);
    if (!category) throw new Error('Category not found');

    const updatedCategory: Category = {
      ...category,
      threadCount: category.threadCount + 1
    };
    this.categories.set(categoryId, updatedCategory);
    return updatedCategory;
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values()).find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const id = this.tagIdCounter++;
    const newTag: Tag = { ...tag, id };
    this.tags.set(id, newTag);
    return newTag;
  }

  // Thread methods
  async getThreads(filter: string = 'latest', categoryId?: number, page: number = 1, limit: number = 10): Promise<ThreadWithRelations[]> {
    let threadsArray = Array.from(this.threads.values());

    // Apply category filter if provided
    if (categoryId) {
      threadsArray = threadsArray.filter(thread => thread.categoryId === categoryId);
    }

    // Apply sorting based on filter
    switch (filter) {
      case 'popular':
        threadsArray.sort((a, b) => b.votes - a.votes);
        break;
      case 'unanswered':
        threadsArray = threadsArray.filter(thread => thread.commentCount === 0);
        threadsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'latest':
      default:
        threadsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    // Paginate results
    const startIndex = (page - 1) * limit;
    const paginatedThreads = threadsArray.slice(startIndex, startIndex + limit);

    // Populate relations for each thread
    const threadsWithRelations = await Promise.all(
      paginatedThreads.map(async (thread) => {
        const author = await this.getUser(thread.userId);
        const category = await this.getCategory(thread.categoryId);
        const tags = await this.getThreadTags(thread.id);

        if (!author || !category) {
          throw new Error('Thread relations not found');
        }

        return {
          ...thread,
          author,
          category,
          tags
        };
      })
    );

    return threadsWithRelations;
  }

  async getThread(id: number): Promise<ThreadWithRelations | undefined> {
    const thread = this.threads.get(id);
    if (!thread) return undefined;

    const author = await this.getUser(thread.userId);
    const category = await this.getCategory(thread.categoryId);
    const tags = await this.getThreadTags(thread.id);

    if (!author || !category) {
      return undefined;
    }

    return {
      ...thread,
      author,
      category,
      tags
    };
  }

  async createThread(threadData: InsertThread, userId: number, tagNames: string[]): Promise<ThreadWithRelations> {
    const id = this.threadIdCounter++;
    const currentDate = new Date();

    const thread: Thread = {
      ...threadData,
      id,
      userId,
      createdAt: currentDate,
      votes: 0,
      commentCount: 0,
      viewCount: 0,
      bookmarkCount: 0
    };

    this.threads.set(id, thread);

    // Increment the category's thread count
    await this.incrementCategoryThreadCount(threadData.categoryId);

    // Increment user's thread count
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUserStats(userId, { threadsCreated: user.threadsCreated + 1 });
    }

    // Handle tags
    const threadTags: Tag[] = [];
    for (const tagName of tagNames) {
      let tag = await this.getTagByName(tagName);

      if (!tag) {
        tag = await this.createTag({ name: tagName });
      }

      await this.addThreadTag({ threadId: id, tagId: tag.id });
      threadTags.push(tag);
    }

    const author = await this.getUser(userId);
    const category = await this.getCategory(threadData.categoryId);

    if (!author || !category) {
      throw new Error('Thread relations not found');
    }

    return {
      ...thread,
      author,
      category,
      tags: threadTags
    };
  }

  async incrementThreadStats(threadId: number, field: 'viewCount' | 'commentCount' | 'bookmarkCount', amount: number = 1): Promise<Thread> {
    const thread = this.threads.get(threadId);
    if (!thread) throw new Error('Thread not found');

    const updatedThread: Thread = {
      ...thread,
      [field]: thread[field] + amount
    };

    this.threads.set(threadId, updatedThread);
    return updatedThread;
  }

  async updateThreadVotes(threadId: number, amount: number): Promise<Thread> {
    const thread = this.threads.get(threadId);
    if (!thread) throw new Error('Thread not found');

    const updatedThread: Thread = {
      ...thread,
      votes: thread.votes + amount
    };

    this.threads.set(threadId, updatedThread);

    // Update user's upvotes received if this is an upvote
    if (amount > 0) {
      const user = await this.getUser(thread.userId);
      if (user) {
        await this.updateUserStats(thread.userId, { upvotesReceived: user.upvotesReceived + amount });
      }
    }

    return updatedThread;
  }

  async getTrendingThreads(limit: number = 3): Promise<ThreadWithRelations[]> {
    const threadsArray = Array.from(this.threads.values());

    // Calculate a trending score (based on votes and comment count, weighted for recency)
    const threadsWithScore = threadsArray.map(thread => {
      const date = new Date(thread.createdAt);
      const now = new Date();
      const ageInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.max(0.1, Math.min(1, 168 / (ageInHours + 12))); // Higher for newer threads (max effect for 1 week)

      const score = (thread.votes * 3 + thread.commentCount * 2) * recencyFactor;

      return {
        thread,
        score
      };
    });

    // Sort by score and take top threads
    threadsWithScore.sort((a, b) => b.score - a.score);
    const topThreads = threadsWithScore.slice(0, limit).map(item => item.thread);

    // Populate relations for each thread
    const threadsWithRelations = await Promise.all(
      topThreads.map(async (thread) => {
        const author = await this.getUser(thread.userId);
        const category = await this.getCategory(thread.categoryId);
        const tags = await this.getThreadTags(thread.id);

        if (!author || !category) {
          throw new Error('Thread relations not found');
        }

        return {
          ...thread,
          author,
          category,
          tags
        };
      })
    );

    return threadsWithRelations;
  }

  // Thread tags methods
  async getThreadTags(threadId: number): Promise<Tag[]> {
    const threadTagsArray = Array.from(this.threadTags.values())
      .filter(tt => tt.threadId === threadId);

    const tags: Tag[] = [];
    for (const tt of threadTagsArray) {
      const tag = await this.getTag(tt.tagId);
      if (tag) tags.push(tag);
    }

    return tags;
  }

  async addThreadTag(threadTag: InsertThreadTag): Promise<ThreadTag> {
    const id = this.threadTagIdCounter++;
    const newThreadTag: ThreadTag = { ...threadTag, id };
    this.threadTags.set(id, newThreadTag);
    return newThreadTag;
  }

  // Comment methods
  async getComments(threadId: number): Promise<CommentWithUser[]> {
    const commentsArray = Array.from(this.comments.values())
      .filter(comment => comment.threadId === threadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const commentsWithUser = await Promise.all(
      commentsArray.map(async (comment) => {
        const author = await this.getUser(comment.userId);

        if (!author) {
          throw new Error('Comment author not found');
        }

        return {
          ...comment,
          author
        };
      })
    );

    return commentsWithUser;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async createComment(commentData: InsertComment, userId: number): Promise<Comment> {
    const id = this.commentIdCounter++;
    const currentDate = new Date();

    const comment: Comment = {
      ...commentData,
      id,
      userId,
      createdAt: currentDate,
      votes: 0
    };

    this.comments.set(id, comment);

    // Increment thread's comment count
    await this.incrementThreadStats(commentData.threadId, 'commentCount');

    // Increment user's comment count
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUserStats(userId, { commentsPosted: user.commentsPosted + 1 });
    }

    return comment;
  }

  async updateCommentVotes(commentId: number, amount: number): Promise<Comment> {
    const comment = this.comments.get(commentId);
    if (!comment) throw new Error('Comment not found');

    const updatedComment: Comment = {
      ...comment,
      votes: comment.votes + amount
    };

    this.comments.set(commentId, updatedComment);

    // Update user's upvotes received if this is an upvote
    if (amount > 0) {
      const user = await this.getUser(comment.userId);
      if (user) {
        await this.updateUserStats(comment.userId, { upvotesReceived: user.upvotesReceived + amount });
      }
    }

    return updatedComment;
  }

  // Vote methods
  async getVote(userId: number, threadId?: number, commentId?: number): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      (vote) =>
        vote.userId === userId &&
        (threadId ? vote.threadId === threadId : true) &&
        (commentId ? vote.commentId === commentId : true)
    );
  }

  async createVote(voteData: InsertVote, userId: number): Promise<Vote> {
    const id = this.voteIdCounter++;

    const vote: Vote = {
      ...voteData,
      id,
      userId
    };

    this.votes.set(id, vote);

    // Update thread or comment votes
    if (vote.threadId) {
      await this.updateThreadVotes(vote.threadId, vote.isUpvote ? 1 : -1);
    } else if (vote.commentId) {
      await this.updateCommentVotes(vote.commentId!, vote.isUpvote ? 1 : -1);
    }

    return vote;
  }

  async updateVote(id: number, isUpvote: boolean): Promise<Vote> {
    const vote = this.votes.get(id);
    if (!vote) throw new Error('Vote not found');

    // Calculate vote change amount
    const changeAmount = vote.isUpvote === isUpvote ? 0 : isUpvote ? 2 : -2;

    const updatedVote: Vote = {
      ...vote,
      isUpvote
    };

    this.votes.set(id, updatedVote);

    // Update thread or comment votes
    if (vote.threadId && changeAmount !== 0) {
      await this.updateThreadVotes(vote.threadId, changeAmount);
    } else if (vote.commentId && changeAmount !== 0) {
      await this.updateCommentVotes(vote.commentId, changeAmount);
    }

    return updatedVote;
  }

  async deleteVote(id: number): Promise<void> {
    const vote = this.votes.get(id);
    if (!vote) throw new Error('Vote not found');

    // Update thread or comment votes
    if (vote.threadId) {
      await this.updateThreadVotes(vote.threadId, vote.isUpvote ? -1 : 1);
    } else if (vote.commentId) {
      await this.updateCommentVotes(vote.commentId, vote.isUpvote ? -1 : 1);
    }

    this.votes.delete(id);
  }

  // Bookmark methods
  async getBookmark(userId: number, threadId: number): Promise<Bookmark | undefined> {
    return Array.from(this.bookmarks.values()).find(
      (bookmark) => bookmark.userId === userId && bookmark.threadId === threadId
    );
  }

  async createBookmark(bookmarkData: InsertBookmark, userId: number): Promise<Bookmark> {
    const id = this.bookmarkIdCounter++;

    const bookmark: Bookmark = {
      ...bookmarkData,
      id,
      userId
    };

    this.bookmarks.set(id, bookmark);

    // Increment thread's bookmark count
    await this.incrementThreadStats(bookmarkData.threadId, 'bookmarkCount');

    return bookmark;
  }

  async deleteBookmark(id: number): Promise<void> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) throw new Error('Bookmark not found');

    // Decrement thread's bookmark count
    await this.incrementThreadStats(bookmark.threadId, 'bookmarkCount', -1);

    this.bookmarks.delete(id);
  }

  // Community stats
  async getCommunityStats(): Promise<{
    memberCount: number;
    threadCount: number;
    commentCount: number;
    onlineCount: number;
  }> {
    return {
      memberCount: this.users.size,
      threadCount: this.threads.size,
      commentCount: this.comments.size,
      onlineCount: Math.floor(Math.random() * 100) + 50, // Simulated online count
    };
  }

  // Seed initial data
  private seedCategories(): void {
    const categoriesData: InsertCategory[] = [
      { name: 'Technology', colorClass: 'bg-primary' },
      { name: 'Design', colorClass: 'bg-success' },
      { name: 'Development', colorClass: 'bg-accent' },
      { name: 'Business', colorClass: 'bg-error' },
      { name: 'General', colorClass: 'bg-secondary' }
    ];

    categoriesData.forEach(category => {
      this.createCategory(category);
    });
  }

  private seedTags(): void {
    const tagsData: InsertTag[] = [
      { name: 'javascript' },
      { name: 'react' },
      { name: 'design' },
      { name: 'web' },
      { name: 'api' },
      { name: 'ux' },
      { name: 'node' }
    ];

    tagsData.forEach(tag => {
      this.createTag(tag);
    });
  }
}

export const storage = new MemStorage();