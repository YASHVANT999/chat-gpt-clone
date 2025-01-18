const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique:true,
    trim: true
  },
  username:
  {
    type: String,
    required: true,
    unique:true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }, 
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const otpVerificationSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expireAt: {
      type: Date,
      default: Date.now() + 3600000 * +1,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
const Otp =  mongoose.model('Otp',otpVerificationSchema);

module.exports = {User,Otp};
