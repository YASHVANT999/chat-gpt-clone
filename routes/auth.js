const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { authLimiter } = require('../middleware/rateLimiter');
const {User,Otp} =require('../models/User');
const authMiddleware = require('../middleware/auth');
const nodemailer = require("nodemailer");


const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').trim().isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),
];

const validateLogin = [
  body('email').trim().isEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const otpGenrater = async (data) => {
  console.log("h");
  sendmail(data);
};
const transporter = nodemailer.createTransport({
  port: 587,
  host: "smtp.gmail.com",
  secure: false,
  auth: {
    user: "yashvant6491@gmail.com",
    pass: "mqygygjifthuqgqz",
  },
});

  // Register
  router.post('/register',validateRegistration, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({status: false, error: errors.array()[0]['msg'] });
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
      res.status(201).json({ message: 'User registered successfully', status:true });
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
      console.log(req.body);
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
      return res.status(404).json({status: false, error: 'User not found' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    const otp = Math.floor(1000 + Math.random() * 9000);
    const mailOptions = {
      from: "yashvant6491@gmail.com",
      to: user.email,
      subject: "Chat AI+ Password Reset Verification",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Chat AI+ Password Reset Verification</h2>
          <p>Dear ${user.name},</p>
          <p>We received a request to reset your password. Please use the following OTP to verify your identity and reset your password:</p>
          <p style="font-size: 1.5em; font-weight: bold; color: #333;">${otp}</p>
          <p>This OTP is valid for the next 10 minutes. If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,<br>Chat AI+ Team</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: 'Unable to send OTP for verification', status: false });
      }

      try {
        await Otp.create({ userId: user._id, otp });
        res.status(200).json({status: true, message: "OTP sent successfully", token: token});
      } catch (otpError) {
        console.error("Error saving OTP:", otpError);
        res.status(500).json({ message: 'Unable to save OTP', error: otpError, status: false });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
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
        return res.status(404).json({status: false, error: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({status:false, error: 'Current password is incorrect' });
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
      res.json({status: true, message: 'Password updated successfully' });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({status: false, error: 'Invalid or expired token' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.post('/verify-otp', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { otp, newPassword } = req.body;
  
    if (!otp) {
      return res.status(400).json({ status: false, error: 'OTP is required' });
    }
  
    try {
      const data = await Otp.findOne({ userId: userId });
  
      if (!data || data.otp !== otp) {
        return res.status(400).json({ status: false, error: 'OTP is invalid' });
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
  
      await Otp.deleteMany({ userId: userId });
      res.status(200).json({ status: true, message: 'Password Changed Successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Server error' });
    }
  });
  

  module.exports = router;

