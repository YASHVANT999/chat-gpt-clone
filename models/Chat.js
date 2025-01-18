const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  conversations: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      userPrompt: {
        type: String,
        required: true
      },
      botResponse: {
        type: String,
        required: true
      },
      likeStatus:{
        type:Number,
        default:0
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],createdAt: {
    type: Date,
    default: Date.now
  }, 
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Chat = mongoose.model('Conversation', chatSchema);

module.exports = Chat;
