const mongoose = require('mongoose');
const { log } = require('../vite');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forum';

mongoose.connect(MONGODB_URI)
  .then(() => log('Connected to MongoDB'))
  .catch(err => log('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  threadsCreated: { type: Number, default: 0 },
  commentsPosted: { type: Number, default: 0 },
  upvotesReceived: { type: Number, default: 0 },
  daysActive: { type: Number, default: 1 },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  colorClass: { type: String, default: 'bg-primary' },
  threadCount: { type: Number, default: 0 }
});

const tagSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true }
});

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  votes: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  bookmarkCount: { type: Number, default: 0 }
});

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  votes: { type: Number, default: 0 }
});

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  isUpvote: { type: Boolean, required: true }
});

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true }
});

// Models
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Tag = mongoose.model('Tag', tagSchema);
const Thread = mongoose.model('Thread', threadSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Vote = mongoose.model('Vote', voteSchema);
const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = {
  mongoose,
  User,
  Category,
  Tag,
  Thread,
  Comment,
  Vote,
  Bookmark
};