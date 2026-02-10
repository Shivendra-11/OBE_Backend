const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },

  // Student-only fields (optional for backward compatibility)
  semester: { type: Number, default: null },
  section: { type: String, default: null },
  // Example: "2022-2026"
  academicYear: { type: String, default: null },
  // Courses a student is enrolled in
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
