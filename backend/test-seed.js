require('dotenv').config();
const mongoose = require('mongoose');

console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('Attempting to connect...');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/obe';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✓ MongoDB connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('✗ Connection failed:', err.message);
    process.exit(1);
  });
