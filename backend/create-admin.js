require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./src/models/User");

async function createAdmin() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/obe";
    console.log("Connecting to MongoDB...");

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✓ MongoDB connected");

    const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    const password = process.env.SEED_ADMIN_PASS || "AdminPass123!";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("✓ Admin already exists:");
      console.log(`  ID: ${existing._id}`);
      console.log(`  Email: ${existing.email}`);
      console.log(`  Name: ${existing.name}`);
      await mongoose.disconnect();
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name: "Administrator",
      email,
      password: hash,
      role: "admin",
    });

    console.log("✓ Admin created successfully:");
    console.log(`  ID: ${admin._id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("✗ Error:", err.message);
    process.exit(1);
  }
}

createAdmin();
