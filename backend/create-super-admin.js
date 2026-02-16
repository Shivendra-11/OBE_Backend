require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

async function createSuperAdmin() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/obe";
    console.log("Connecting to MongoDB...");

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✓ MongoDB connected");

    const email = "admin@example.com";
    const password = "Admin123!";
    const name = "System Administrator";

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Checking existing user...");
      // If exists but not admin, maybe update? Or just warn.
      if (existing.role !== 'admin') {
          console.log(`User ${email} exists but is role: ${existing.role}. Updating to admin...`);
          existing.role = 'admin';
          await existing.save();
          console.log("✓ User updated to admin.");
      } else {
          console.log("✓ Admin already exists with this email.");
      }
    } else {
        const hash = await bcrypt.hash(password, 10);
        const admin = await User.create({
        name,
        email,
        password: hash,
        role: "admin",
        });

        console.log("✓ Admin created successfully:");
        console.log(`  Name: ${admin.name}`);
        console.log(`  Email: ${admin.email}`);
        console.log(`  Role: ${admin.role}`);
    }

    // Always print credentials for the user
    console.log("\n===========================================");
    console.log("ADMIN CREDENTIALS:");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log("===========================================\n");

    await mongoose.disconnect();
  } catch (err) {
    console.error("✗ Error:", err.message);
    process.exit(1);
  }
}

createSuperAdmin();
