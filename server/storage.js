
const { User, Category, Tag, Thread, Comment, Vote, Bookmark } = require('./db/mongodb');
const session = require('express-session');
const MongoStore = require('connect-mongo');

class MongoStorage {
  constructor() {
    this.sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/forum',
      ttl: 14 * 24 * 60 * 60 // = 14 days
    });
    
    // Seed initial data
    this.seedInitialData();
  }

  async seedInitialData() {
    try {
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
  async getUser(id) {
    return User.findById(id);
  }

  async getUserByUsername(username) {
    return User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
  }

  async createUser(userData) {
    const user = new User(userData);
    return user.save();
  }

  async updateUserStats(userId, stats) {
    return User.findByIdAndUpdate(userId, stats, { new: true });
  }

  // Category methods
  async getCategories() {
    return Category.find();
  }

  async getCategory(id) {
    return Category.findById(id);
  }

  async createCategory(categoryData) {
    const category = new Category(categoryData);
    return category.save();
  }

  // Thread methods
  async getThreads(filter = 'latest', categoryId, page = 1, limit = 10) {
    let query = Thread.find();
    
    if (categoryId) {
      query = query.where('categoryId', categoryId);
    }

    switch (filter) {
      case 'popular':
        query = query.sort('-votes');
        break;
      case 'unanswered':
        query = query.where('commentCount', 0).sort('-createdAt');
        break;
      default:
        query = query.sort('-createdAt');
    }

    const threads = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'username avatar')
      .populate('categoryId')
      .exec();

    // Get tags for each thread
    const threadsWithTags = await Promise.all(
      threads.map(async (thread) => {
        const tags = await this.getThreadTags(thread._id);
        return {
          ...thread.toObject(),
          tags,
          author: thread.userId,
          category: thread.categoryId
        };
      })
    );

    return threadsWithTags;
  }

  async createThread(threadData, userId, tagNames) {
    const thread = new Thread({
      ...threadData,
      userId,
      createdAt: new Date()
    });
    await thread.save();

    // Handle tags
    for (const tagName of tagNames) {
      let tag = await this.getTagByName(tagName);
      if (!tag) {
        tag = await this.createTag({ name: tagName });
      }
      await Tag.findByIdAndUpdate(tag._id, { $addToSet: { threads: thread._id } });
    }

    return this.getThread(thread._id);
  }

  async getComments(threadId) {
    return Comment.find({ threadId })
      .sort('-createdAt')
      .populate('userId', 'username avatar')
      .exec();
  }

  async createComment(commentData, userId) {
    const comment = new Comment({
      ...commentData,
      userId,
      createdAt: new Date()
    });
    await comment.save();

    // Update thread comment count
    await Thread.findByIdAndUpdate(commentData.threadId, { $inc: { commentCount: 1 } });
    
    return comment;
  }

  async getTrendingThreads(limit = 3) {
    return Thread.find()
      .sort('-votes -commentCount -createdAt')
      .limit(limit)
      .populate('userId', 'username avatar')
      .populate('categoryId')
      .exec();
  }

  async getCommunityStats() {
    const [userCount, threadCount, commentCount] = await Promise.all([
      User.countDocuments(),
      Thread.countDocuments(),
      Comment.countDocuments()
    ]);

    return {
      memberCount: userCount,
      threadCount,
      commentCount,
      onlineCount: Math.floor(Math.random() * 100) + 50 // Simulated
    };
  }
}

const storage = new MongoStorage();
module.exports = { storage };
