const { ObjectId } = require('mongodb');

const chatAuth = (db) => async (req, res, next) => {
  try {
    const chatId = req.params.chatId || req.body.chatId;
    if (!chatId) return next();

    const chat = await db.collection('chats').findOne({ chatId });
    
    if (!chat) return next();

    // Allow access if user is admin or chat creator
    if (req.user.role === 'admin' || 
        chat.userId.equals(new ObjectId(req.user.userId))) {
      return next();
    }

    res.status(403).json({ 
      status: 'error',
      message: 'Not authorized to access this chat' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Authorization check failed' 
    });
  }
};

module.exports = chatAuth;