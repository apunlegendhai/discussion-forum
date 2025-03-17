const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  threadsCreated: {
    type: Number,
    default: 0
  },
  commentsPosted: {
    type: Number,
    default: 0
  },
  upvotesReceived: {
    type: Number,
    default: 0
  },
  daysActive: {
    type: Number,
    default: 1
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
});

module.exports = mongoose.model('User', UserSchema);