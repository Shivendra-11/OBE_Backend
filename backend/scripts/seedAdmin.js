require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const User = require('../src/models/User');

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/obe';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASS || 'AdminPass123!';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', existing._id.toString());
    await mongoose.disconnect();
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const admin = await User.create({ name: 'Administrator', email, password: hash, role: 'admin' });
  console.log('Created admin:', admin._id.toString(), 'email:', admin.email);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed', err);
  process.exit(1);
});
