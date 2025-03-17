import { mongoose } from "./db/mongodb";
import {
  users, categories, tags, threads, threadTags, comments, votes, bookmarks,
  type User, type InsertUser, type Category, type InsertCategory,
  type Tag, type InsertTag, type Thread, type InsertThread,
  type ThreadTag, type InsertThreadTag, type Comment, type InsertComment,
  type Vote, type InsertVote, type Bookmark, type InsertBookmark,
  type ThreadWithRelations, type CommentWithUser
} from "@shared/schema";
import session from "express-session";
import MongoStore from "connect-mongo";

export const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/forum',
  ttl: 14 * 24 * 60 * 60 // = 14 days
});

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(userId: string, stats: Partial<User>): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  incrementCategoryThreadCount(categoryId: string): Promise<Category>;

  // Tag methods
  getTags(): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | undefined>;
  getTagByName(name: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;

  // Thread methods
  getThreads(filter?: string, categoryId?: string, page?: number, limit?: number): Promise<ThreadWithRelations[]>;
  getThread(id: string): Promise<ThreadWithRelations | undefined>;
  createThread(thread: InsertThread, userId: string, tagNames: string[]): Promise<ThreadWithRelations>;
  incrementThreadStats(threadId: string, field: 'viewCount' | 'commentCount' | 'bookmarkCount', amount?: number): Promise<Thread>;
  updateThreadVotes(threadId: string, amount: number): Promise<Thread>;
  getTrendingThreads(limit?: number): Promise<ThreadWithRelations[]>;

  // Thread Tags methods
  getThreadTags(threadId: string): Promise<Tag[]>;
  addThreadTag(threadTag: InsertThreadTag): Promise<ThreadTag>;

  // Comment methods
  getComments(threadId: string): Promise<CommentWithUser[]>;
  getComment(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment, userId: string): Promise<Comment>;
  updateCommentVotes(commentId: string, amount: number): Promise<Comment>;

  // Vote methods
  getVote(userId: string, threadId?: string, commentId?: string): Promise<Vote | undefined>;
  createVote(vote: InsertVote, userId: string): Promise<Vote>;
  updateVote(id: string, isUpvote: boolean): Promise<Vote>;
  deleteVote(id: string): Promise<void>;

  // Bookmark methods
  getBookmark(userId: string, threadId: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark, userId: string): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<void>;

  // Community stats
  getCommunityStats(): Promise<{
    memberCount: number;
    threadCount: number;
    commentCount: number;
    onlineCount: number;
  }>;

  // Session store
  sessionStore: MongoStore.MongoStoreFactory;
}

export class MongoStorage implements IStorage {
  sessionStore: MongoStore.MongoStoreFactory;

  constructor() {
    this.sessionStore = sessionStore;
    // Seed initial data
    this.seedInitialData();
  }

  private async seedInitialData() {
    try {
      const { Category, Tag } = await import('./db/mongodb');
      const categoriesCount = await Category.countDocuments();
      if (categoriesCount === 0) {
        await Category.insertMany([
          { name: 'Technology', colorClass: 'bg-primary' },
          { name: 'Design', colorClass: 'bg-success' },
          { name: 'Development', colorClass: 'bg-accent' },
          { name: 'Business', colorClass: 'bg-error' },
          { name: 'General', colorClass: 'bg-secondary' }
        ]);
      }

      const tagsCount = await Tag.countDocuments();
      if (tagsCount === 0) {
        await Tag.insertMany([
          { name: 'javascript' },
          { name: 'react' },
          { name: 'design' },
          { name: 'web' },
          { name: 'api' },
          { name: 'ux' },
          { name: 'node' }
        ]);
      }
    } catch (error) {
      console.error('Error seeding initial data:', error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const { User } = await import('./db/mongodb');
    const user = await User.findById(id);
    return user ? user.toObject() : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { User } = await import('./db/mongodb');
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    return user ? user.toObject() : undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const { User } = await import('./db/mongodb');
    const user = new User({
      ...userData,
      createdAt: new Date(),
      threadsCreated: 0,
      commentsPosted: 0,
      upvotesReceived: 0,
      daysActive: 1,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`
    });
    await user.save();
    return user.toObject();
  }

  async updateUserStats(userId: string, stats: Partial<User>): Promise<User> {
    const { User } = await import('./db/mongodb');
    const user = await User.findByIdAndUpdate(userId, { $set: stats }, { new: true });
    if (!user) throw new Error('User not found');
    return user.toObject();
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    const { Category } = await import('./db/mongodb');
    const categories = await Category.find();
    return categories.map(c => c.toObject());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const { Category } = await import('./db/mongodb');
    const category = await Category.findById(id);
    return category ? category.toObject() : undefined;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const { Category } = await import('./db/mongodb');
    const category = new Category({ ...categoryData, threadCount: 0 });
    await category.save();
    return category.toObject();
  }

  async incrementCategoryThreadCount(categoryId: string): Promise<Category> {
    const { Category } = await import('./db/mongodb');
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $inc: { threadCount: 1 } },
      { new: true }
    );
    if (!category) throw new Error('Category not found');
    return category.toObject();
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    const { Tag } = await import('./db/mongodb');
    const tags = await Tag.find();
    return tags.map(t => t.toObject());
  }

  async getTag(id: string): Promise<Tag | undefined> {
    const { Tag } = await import('./db/mongodb');
    const tag = await Tag.findById(id);
    return tag ? tag.toObject() : undefined;
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    const { Tag } = await import('./db/mongodb');
    const tag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    return tag ? tag.toObject() : undefined;
  }

  async createTag(tagData: InsertTag): Promise<Tag> {
    const { Tag } = await import('./db/mongodb');
    const tag = new Tag(tagData);
    await tag.save();
    return tag.toObject();
  }


  // Thread methods
  async getThreads(filter: string = 'latest', categoryId?: string, page: number = 1, limit: number = 10): Promise<ThreadWithRelations[]> {
    const { Thread } = await import('./db/mongodb');
    let query = Thread.find(categoryId ? { categoryId } : {});

    switch (filter) {
      case 'popular':
        query = query.sort('-votes');
        break;
      case 'unanswered':
        query = query.find({ commentCount: 0 }).sort('-createdAt');
        break;
      default:
        query = query.sort('-createdAt');
    }

    const threads = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'username avatar')
      .populate('categoryId')
      .populate('tags');

    return threads.map(t => t.toObject());
  }

  async getThread(id: string): Promise<ThreadWithRelations | undefined> {
    const { Thread } = await import('./db/mongodb');
    const thread = await Thread.findById(id)
      .populate('userId', 'username avatar')
      .populate('categoryId')
      .populate('tags');
    return thread ? thread.toObject() : undefined;
  }

  async createThread(threadData: InsertThread, userId: string, tagNames: string[]): Promise<ThreadWithRelations> {
    const { Thread, Tag } = await import('./db/mongodb');

    // Handle tags
    const tags = await Promise.all(
      tagNames.map(async name => {
        let tag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (!tag) {
          tag = new Tag({ name });
          await tag.save();
        }
        return tag;
      })
    );

    const thread = new Thread({
      ...threadData,
      userId,
      createdAt: new Date(),
      votes: 0,
      commentCount: 0,
      viewCount: 0,
      bookmarkCount: 0,
      tags: tags.map(t => t._id)
    });

    await thread.save();
    await this.incrementCategoryThreadCount(threadData.categoryId);
    await this.updateUserStats(userId, { $inc: { threadsCreated: 1 } });

    return (await thread.populate(['userId', 'categoryId', 'tags'])).toObject();
  }

  async incrementThreadStats(threadId: string, field: 'viewCount' | 'commentCount' | 'bookmarkCount', amount: number = 1): Promise<Thread> {
    const { Thread } = await import('./db/mongodb');
    const thread = await Thread.findByIdAndUpdate(threadId, { $inc: { [field]: amount } }, { new: true });
    if (!thread) throw new Error('Thread not found');
    return thread.toObject();
  }

  async updateThreadVotes(threadId: string, amount: number): Promise<Thread> {
    const { Thread } = await import('./db/mongodb');
    const thread = await Thread.findByIdAndUpdate(threadId, { $inc: { votes: amount } }, { new: true });
    if (!thread) throw new Error('Thread not found');

    if (amount > 0) {
      await this.updateUserStats(thread.userId, { $inc: { upvotesReceived: amount } });
    }

    return thread.toObject();
  }

  async getTrendingThreads(limit: number = 3): Promise<ThreadWithRelations[]> {
    const { Thread } = await import('./db/mongodb');
    const threads = await Thread.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username avatar')
      .populate('categoryId')
      .populate('tags');

    return threads.map(t => t.toObject());

  }

  // Thread tags methods
  async getThreadTags(threadId: string): Promise<Tag[]> {
    const { ThreadTag, Tag } = await import('./db/mongodb');
    const threadTags = await ThreadTag.find({ threadId }).populate('tagId');
    return threadTags.map(tt => tt.tagId).map(t => t.toObject());
  }

  async addThreadTag(threadTagData: InsertThreadTag): Promise<ThreadTag> {
    const { ThreadTag } = await import('./db/mongodb');
    const threadTag = new ThreadTag(threadTagData);
    await threadTag.save();
    return threadTag.toObject();
  }

  // Comment methods
  async getComments(threadId: string): Promise<CommentWithUser[]> {
    const { Comment } = await import('./db/mongodb');
    const comments = await Comment.find({ threadId })
      .sort({ createdAt: -1 })
      .populate('userId', 'username avatar');
    return comments.map(c => c.toObject());
  }

  async getComment(id: string): Promise<Comment | undefined> {
    const { Comment } = await import('./db/mongodb');
    const comment = await Comment.findById(id).populate('userId', 'username avatar');
    return comment ? comment.toObject() : undefined;
  }

  async createComment(commentData: InsertComment, userId: string): Promise<Comment> {
    const { Comment } = await import('./db/mongodb');
    const comment = new Comment({
      ...commentData,
      userId,
      createdAt: new Date(),
      votes: 0
    });
    await comment.save();
    await this.incrementThreadStats(commentData.threadId, 'commentCount');
    await this.updateUserStats(userId, { $inc: { commentsPosted: 1 } });
    return comment.toObject();
  }

  async updateCommentVotes(commentId: string, amount: number): Promise<Comment> {
    const { Comment } = await import('./db/mongodb');
    const comment = await Comment.findByIdAndUpdate(commentId, { $inc: { votes: amount } }, { new: true });
    if (!comment) throw new Error('Comment not found');
    if (amount > 0) {
      await this.updateUserStats(comment.userId, { $inc: { upvotesReceived: amount } });
    }
    return comment.toObject();
  }

  // Vote methods
  async getVote(userId: string, threadId?: string, commentId?: string): Promise<Vote | undefined> {
    const { Vote } = await import('./db/mongodb');
    const query = { userId };
    if (threadId) query.threadId = threadId;
    if (commentId) query.commentId = commentId;
    const vote = await Vote.findOne(query);
    return vote ? vote.toObject() : undefined;
  }

  async createVote(voteData: InsertVote, userId: string): Promise<Vote> {
    const { Vote } = await import('./db/mongodb');
    const vote = new Vote({ ...voteData, userId });
    await vote.save();
    if (voteData.threadId) {
      await this.updateThreadVotes(voteData.threadId, voteData.isUpvote ? 1 : -1);
    } else if (voteData.commentId) {
      await this.updateCommentVotes(voteData.commentId, voteData.isUpvote ? 1 : -1);
    }
    return vote.toObject();
  }

  async updateVote(id: string, isUpvote: boolean): Promise<Vote> {
    const { Vote } = await import('./db/mongodb');
    const vote = await Vote.findById(id);
    if (!vote) throw new Error('Vote not found');
    const changeAmount = vote.isUpvote === isUpvote ? 0 : isUpvote ? 2 : -2;
    await Vote.findByIdAndUpdate(id, { isUpvote });
    if (vote.threadId && changeAmount !== 0) {
      await this.updateThreadVotes(vote.threadId, changeAmount);
    } else if (vote.commentId && changeAmount !== 0) {
      await this.updateCommentVotes(vote.commentId, changeAmount);
    }
    return (await Vote.findById(id)).toObject();
  }

  async deleteVote(id: string): Promise<void> {
    const { Vote } = await import('./db/mongodb');
    const vote = await Vote.findById(id);
    if (!vote) throw new Error('Vote not found');
    if (vote.threadId) {
      await this.updateThreadVotes(vote.threadId, vote.isUpvote ? -1 : 1);
    } else if (vote.commentId) {
      await this.updateCommentVotes(vote.commentId, vote.isUpvote ? -1 : 1);
    }
    await Vote.findByIdAndDelete(id);
  }

  // Bookmark methods
  async getBookmark(userId: string, threadId: string): Promise<Bookmark | undefined> {
    const { Bookmark } = await import('./db/mongodb');
    const bookmark = await Bookmark.findOne({ userId, threadId });
    return bookmark ? bookmark.toObject() : undefined;
  }

  async createBookmark(bookmarkData: InsertBookmark, userId: string): Promise<Bookmark> {
    const { Bookmark } = await import('./db/mongodb');
    const bookmark = new Bookmark({ ...bookmarkData, userId });
    await bookmark.save();
    await this.incrementThreadStats(bookmarkData.threadId, 'bookmarkCount');
    return bookmark.toObject();
  }

  async deleteBookmark(id: string): Promise<void> {
    const { Bookmark } = await import('./db/mongodb');
    const bookmark = await Bookmark.findById(id);
    if (!bookmark) throw new Error('Bookmark not found');
    await this.incrementThreadStats(bookmark.threadId, 'bookmarkCount', -1);
    await Bookmark.findByIdAndDelete(id);
  }

  // Community stats
  async getCommunityStats(): Promise<{
    memberCount: number;
    threadCount: number;
    commentCount: number;
    onlineCount: number;
  }> {
    const { User, Thread, Comment } = await import('./db/mongodb');
    const [memberCount, threadCount, commentCount] = await Promise.all([
      User.countDocuments(),
      Thread.countDocuments(),
      Comment.countDocuments()
    ]);
    return {
      memberCount,
      threadCount,
      commentCount,
      onlineCount: Math.floor(Math.random() * 100) + 50, // Simulated online count
    };
  }
}

export const storage = new MongoStorage();