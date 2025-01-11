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
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

const Chat = mongoose.model('Conversation', chatSchema);

module.exports = Chat;


// const { ObjectId } = require('mongodb');

// class Chat {
//   constructor(db) {
//     this.collection = db.collection('chats');
//   }

//   async createMessage({ chatId, userId, message, timestamp = new Date() }) {
//     const chat = {
//       chatId,
//       userId: new ObjectId(userId),
//       message,
//       timestamp,
//       createdAt: new Date()
//     };

//     const result = await this.collection.insertOne(chat);
//     return { ...chat, _id: result.insertedId };
//   }

//   async getChatHistory(chatId, { page = 1, limit = 20 }) {
//     const skip = (page - 1) * limit;
    
//     const messages = await this.collection
//       .find({ chatId })
//       .sort({ timestamp: 1 })
//       .skip(skip)
//       .limit(limit)
//       .toArray();

//     const total = await this.collection.countDocuments({ chatId });
    
//     return {
//       messages,
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit)
//       }
//     };
//   }

//   async searchMessages({ userId, keyword, chatId }) {
//     const query = {};
    
//     if (userId) query.userId = new ObjectId(userId);
//     if (chatId) query.chatId = chatId;
//     if (keyword) query.message = { $regex: keyword, $options: 'i' };

//     return this.collection
//       .find(query)
//       .sort({ timestamp: -1 })
//       .toArray();
//   }

//   async deleteChat(chatId) {
//     const result = await this.collection.deleteMany({ chatId });
//     return result.deletedCount;
//   }

//   async getChatMessagesForSummary(chatId) {
//     return this.collection
//       .find({ chatId })
//       .sort({ timestamp: 1 })
//       .toArray();
//   }
// }