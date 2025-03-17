const mongoose = require('mongoose');
const { log } = require('../vite');

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('MongoDB connected successfully', 'mongodb');
    return true;
  } catch (error) {
    log(`MongoDB connection error: ${error.message}`, 'mongodb');
    console.error('MongoDB connection error:', error);
    return false;
  }
};

module.exports = { connectToMongoDB, mongoose };