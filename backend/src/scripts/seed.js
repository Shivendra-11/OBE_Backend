const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config(); // Uses .env from CWD (backend root)

const seedUsers = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/OBEbackend';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB Connected for Seeding');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@obe.com',
        password: passwordHash,
        role: 'admin'
      },
      {
        name: 'Teacher User',
        email: 'teacher@obe.com',
        password: passwordHash,
        role: 'teacher'
      },
      {
        name: 'Student User',
        email: 'student@obe.com',
        password: passwordHash,
        role: 'student',
        semester: 5,
        section: 'A',
        academicYear: '2023-2024'
      }
    ];

    for (const user of users) {
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        await User.create(user);
        console.log(`Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('SEEDING ERROR:', err);
    process.exit(1);
  }
};

seedUsers();
