
const { User, Category, Tag, Thread, Comment, Vote, Bookmark } = require('./db/mongodb');
const createMemoryStore = require('memorystore');
const session = require('express-session');

const MemoryStore = createMemoryStore(session);

class MongoStorage {
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
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

  // Add remaining methods (createThread, getComments, etc.)
  // ... implement all other methods similar to the original storage.ts
  // but using Mongoose operations instead of in-memory storage
}

const storage = new MongoStorage();
module.exports = { storage };
