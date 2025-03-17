
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const TagSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

export default mongoose.model('Tag', TagSchema);
