require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./src/models/User");

async function createTeachers() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/obe";
    console.log("Connecting to MongoDB...");

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✓ MongoDB connected");

    const teachers = [
      {
        name: "Dr. John Smith",
        email: "teacher1@example.com",
        password: "Teacher123!",
      },
      {
        name: "Dr. Sarah Johnson",
        email: "teacher2@example.com",
        password: "Teacher123!",
      },
    ];

    const createdTeachers = [];

    for (const teacher of teachers) {
      const existing = await User.findOne({ email: teacher.email });
      if (existing) {
        console.log(`⚠ Teacher already exists: ${teacher.email}`);
        continue;
      }

      const hash = await bcrypt.hash(teacher.password, 10);
      const newTeacher = await User.create({
        name: teacher.name,
        email: teacher.email,
        password: hash,
        role: "teacher",
      });

      createdTeachers.push(newTeacher);
      console.log(`✓ Teacher created successfully:`);
      console.log(`  ID: ${newTeacher._id}`);
      console.log(`  Email: ${newTeacher.email}`);
      console.log(`  Name: ${newTeacher.name}`);
      console.log(`  Role: ${newTeacher.role}`);
      console.log();
    }

    console.log(`✓ Total teachers created: ${createdTeachers.length}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("✗ Error:", err.message);
    process.exit(1);
  }
}

createTeachers();
