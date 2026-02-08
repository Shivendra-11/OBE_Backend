require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/obe';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const User = require('../src/models/User');
  const email = process.env.CHECK_EMAIL || 'admin@example.com';
  const password = process.env.CHECK_PASS || 'AdminPass123!';
  const u = await User.findOne({ email }).lean();
  if (!u) {
    console.log('NOT_FOUND');
    await mongoose.disconnect();
    return;
  }
  const match = await bcrypt.compare(password, u.password);
  console.log('FOUND', { id: u._id.toString(), email: u.email, role: u.role, passwordMatches: match });
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
