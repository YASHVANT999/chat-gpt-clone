const express = require('express');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const connectDB = require('./db');
var cors = require('cors')
const app = express();
const port = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json());


// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Base URL route
app.get('/', (req, res) => {
  res.send('Server is Currently Running');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});