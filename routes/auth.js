const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { authLimiter } = require('../middleware/rateLimiter');
const User =require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),

];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

  // Register
  router.post('/register', async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password, name ,username} = req.body;
      console.log(req.body);
      
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
      name:name,
        email: email.toLowerCase(),
        password: hashedPassword,username:username
      });
      await user.save();
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Login
  router.post('/login', validateLogin, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.json({message:"Login Successfully", token, user });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Forgot Password
  router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const resetToken = jwt.sign(
        { userId: user._id },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // In a real application, send this token via email
      // For demo purposes, we'll return it in the response
      res.json({
        message: 'Password reset token generated',
        resetToken
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

//reset-user-password
  router.post('/reset-password', authMiddleware, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
  
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  module.exports = router;

