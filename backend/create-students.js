require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./src/models/User");

async function createStudents() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/obe";
    console.log("Connecting to MongoDB...");

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✓ MongoDB connected");

    const students = [
      // Section A - 3 students
      {
        name: "Raj Kumar",
        email: "raj.kumar@example.com",
        password: "Student123!",
        semester: 3,
        section: "A",
        academicYear: "2022-2026",
      },
      {
        name: "Priya Singh",
        email: "priya.singh@example.com",
        password: "Student123!",
        semester: 3,
        section: "A",
        academicYear: "2022-2026",
      },
      {
        name: "Arjun Patel",
        email: "arjun.patel@example.com",
        password: "Student123!",
        semester: 3,
        section: "A",
        academicYear: "2022-2026",
      },
      // Section B - 2 students
      {
        name: "Neha Gupta",
        email: "neha.gupta@example.com",
        password: "Student123!",
        semester: 3,
        section: "B",
        academicYear: "2022-2026",
      },
      {
        name: "Aditya Sharma",
        email: "aditya.sharma@example.com",
        password: "Student123!",
        semester: 3,
        section: "B",
        academicYear: "2022-2026",
      },
    ];

    const createdStudents = [];

    for (const student of students) {
      const existing = await User.findOne({ email: student.email });
      if (existing) {
        console.log(`⚠ Student already exists: ${student.email}`);
        continue;
      }

      const hash = await bcrypt.hash(student.password, 10);
      const newStudent = await User.create({
        name: student.name,
        email: student.email,
        password: hash,
        role: "student",
        semester: student.semester,
        section: student.section,
        academicYear: student.academicYear,
      });

      createdStudents.push(newStudent);
      console.log(`✓ Student created successfully:`);
      console.log(`  ID: ${newStudent._id}`);
      console.log(`  Email: ${newStudent.email}`);
      console.log(`  Name: ${newStudent.name}`);
      console.log(`  Semester: ${newStudent.semester}`);
      console.log(`  Section: ${newStudent.section}`);
      console.log(`  Academic Year: ${newStudent.academicYear}`);
      console.log(`  Role: ${newStudent.role}`);
      console.log();
    }

    console.log(`✓ Total students created: ${createdStudents.length}`);
    console.log(`  Section A: 3 students`);
    console.log(`  Section B: 2 students`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("✗ Error:", err.message);
    process.exit(1);
  }
}

createStudents();
