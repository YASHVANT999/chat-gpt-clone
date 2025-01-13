const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const chatAuth = require('../middleware/chatAuth');
const Chat =  require('../models/Chat');
const OpenAIService =  require('../services/openai');


const router = express.Router();

// Validation middleware
const validateCreateMessage = [
  body('chatId').notEmpty().trim(),
  body('message').notEmpty().trim()
];

const validateGetHistory = [
  param('chatId').notEmpty().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

const validateSearch = [
  query('keyword').optional().trim(),
  query('chatId').optional().trim(),
  query('userId').optional().trim()
];

// Get all conversations for a user.
router.get('/get-all-conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Fetching conversations for user:", userId);

    const chats = await Chat.find({ userId });

    res.status(200).json({ message: 'All Conversations fetched successfully', chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


//get a single conversations by id.
router.get('/get-conversation/:id', authMiddleware, async (req, res) => {
  try {
    const {id}= req.params;
    console.log("Fetching conversations for user:", userId,id);

    const chats = await Chat.findOne({ _id:id });

    res.status(200).json({ message: 'Conversations retrieved successfully', chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update a chat conversation
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { chatId, userPrompt, botResponse } = req.body;
    const userId = req.user.userId;

    console.log("Hello this yashvant:",userId);

    if (!userPrompt || !botResponse) {
      return res.status(400).json({ error: 'User prompt and bot response are required' });
    }

    let chat;

    if (chatId) {
      // Check if an existing conversation with the provided chatId exists
      chat = await Chat.findOne({ _id: chatId, userId });

      if (chat) {
        // Update the existing conversation
        chat.conversations.push({ userPrompt, botResponse });
      } else {
        return res.status(404).json({ error: 'Chat not found' });
      }
    } else {
        // Create a new conversation
        chat = new Chat({
         userId: userId,
          title: userPrompt,
          conversations: [
            {
              userPrompt,
              botResponse
            }
          ]
        });
    }
    await chat.save();
    res.status(201).json({ message: 'Chat saved successfully', chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;

// module.exports = (db) => {

//   // Create message
//   router.post('/', 
//     authMiddleware,
//     validateCreateMessage,
//     async (req, res) => {
//       try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//           return res.status(400).json({
//             status: 'error',
//             errors: errors.array()
//           });
//         }

//         const { chatId, message } = req.body;
//         const userId = req.user.userId;

//         const chat = await Chat.createMessage({
//           chatId,
//           userId,
//           message
//         });

//         res.status(201).json({
//           status: 'success',
//           data: chat
//         });
//       } catch (error) {
//         res.status(500).json({
//           status: 'error',
//           message: 'Failed to create message'
//         });
//       }
//     }
//   );

//   // Get chat history
//   router.get('/:chatId',
//     authMiddleware,
//     chatAuth(db),
//     validateGetHistory,
//     async (req, res) => {
//       try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//           return res.status(400).json({
//             status: 'error',
//             errors: errors.array()
//           });
//         }

//         const { chatId } = req.params;
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 20;

//         const result = await Chat.getChatHistory(chatId, { page, limit });

//         res.json({
//           status: 'success',
//           data: result
//         });
//       } catch (error) {
//         res.status(500).json({
//           status: 'error',
//           message: 'Failed to fetch chat history'
//         });
//       }
//     }
//   );

//   // Search messages
//   router.get('/search',
//     authMiddleware,
//     validateSearch,
//     async (req, res) => {
//       try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//           return res.status(400).json({
//             status: 'error',
//             errors: errors.array()
//           });
//         }

//         const { keyword, chatId, userId } = req.query;
//         const messages = await Chat.searchMessages({ 
//           userId, 
//           keyword, 
//           chatId 
//         });

//         res.json({
//           status: 'success',
//           data: messages
//         });
//       } catch (error) {
//         res.status(500).json({
//           status: 'error',
//           message: 'Failed to search messages'
//         });
//       }
//     }
//   );

//   // Delete chat
//   router.delete('/:chatId',
//     authMiddleware,
//     chatAuth(db),
//     async (req, res) => {
//       try {
//         const { chatId } = req.params;
//         const deletedCount = await Chat.deleteChat(chatId);

//         res.json({
//           status: 'success',
//           data: { deletedCount }
//         });
//       } catch (error) {
//         res.status(500).json({
//           status: 'error',
//           message: 'Failed to delete chat'
//         });
//       }
//     }
//   );

//   // Get chat summary
//   router.get('/:chatId/summary',
//     authMiddleware,
//     chatAuth(db),
//     async (req, res) => {
//       try {
//         const { chatId } = req.params;
//         const messages = await Chat.getChatMessagesForSummary(chatId);
        
//         if (messages.length === 0) {
//           return res.status(404).json({
//             status: 'error',
//             message: 'No messages found for this chat'
//           });
//         }

//         const summary = await OpenAIService.summarizeChat(messages);

//         res.json({
//           status: 'success',
//           data: { summary }
//         });
//       } catch (error) {
//         res.status(500).json({
//           status: 'error',
//           message: 'Failed to generate chat summary'
//         });
//       }
//     }
//   );

//   return router;
// };