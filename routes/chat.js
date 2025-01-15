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

    res.status(200).json({ message: 'All Conversations fetched success', chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


//get a single conversations by id.
router.get('/get-conversation/:id', authMiddleware, async (req, res) => {
  try {
    const {id}= req.params;

    const chats = await Chat.findOne({ _id:id });

    res.status(200).json({ message: 'Conversations retrieved successfully', chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//delete a single conversations by id.
router.delete('/get-conversation/:id', authMiddleware, async (req, res) => {
  try {
    const {id}= req.params;

    const chats = await Chat.findByIdAndDelete({ _id:id });

    res.status(200).json({ message: 'Conversation Deleted Successfully', chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//update a single conversations by id.
router.put('/get-conversation/:id', authMiddleware, async (req, res) => {
  try {
    const {title}=req.body;
    const {id}= req.params;

    const chats = await Chat.findByIdAndUpdate(
      { _id: id },
      { $set: { title: title } },
      { new: true }
    );
    
    res.status(200).json({ message: 'Conversation Deleted Successfully', chats });
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