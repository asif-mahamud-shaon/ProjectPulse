const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://asif_mahamud_shaon:asif_mahamud_shaon200@cluster0.bdborqr.mongodb.net/projectpulse?appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  console.log('⚠️  Retrying connection...');
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'ProjectPulse API is running' });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/risks', require('./routes/risks'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

