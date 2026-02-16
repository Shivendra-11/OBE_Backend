const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, studentId, semester, section, academicYear } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // default role is student
    const user = await User.create({
      name,
      email,
      password: hash,
      studentId: studentId == null ? null : String(studentId).trim(),
      semester: semester == null ? null : Number(semester),
      section: section == null ? null : String(section),
      academicYear: academicYear == null ? null : String(academicYear),
    });

    res
      .status(201)
      .json({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const payload = { id: user._id, email: user.email };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "please_change_this_secret",
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin-only: create user with specific role (teacher/admin)
router.post("/create", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role, studentId, semester, section, academicYear } =
      req.body;
    if (!email || !password || !role)
      return res
        .status(400)
        .json({ message: "name,email,password,role required" });
    if (!["student", "teacher", "admin"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      studentId:
        role === "student" && studentId != null ? String(studentId).trim() : null,
      semester:
        role === "student" && semester != null ? Number(semester) : null,
      section: role === "student" && section != null ? String(section) : null,
      academicYear:
        role === "student" && academicYear != null
          ? String(academicYear)
          : null,
    });
    res
      .status(201)
      .json({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin-only: create multiple users at once
router.post(
  "/create-bulk",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { users } = req.body;
      if (!Array.isArray(users) || users.length === 0) {
        return res
          .status(400)
          .json({ message: "users array required and must not be empty" });
      }

      const createdUsers = [];
      const errors = [];

      for (let i = 0; i < users.length; i++) {
        const { name, email, password, role, studentId, semester, section, academicYear } =
          users[i];

        // Validate required fields
        if (!email || !password || !role) {
          errors.push({
            index: i,
            email,
            message: "name, email, password, role required",
          });
          continue;
        }

        // Validate role
        if (!["student", "teacher", "admin"].includes(role)) {
          errors.push({ index: i, email, message: "Invalid role" });
          continue;
        }

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
          errors.push({ index: i, email, message: "User already exists" });
          continue;
        }

        try {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);

          const user = await User.create({
            name,
            email,
            password: hash,
            role,
            studentId:
              role === "student" && studentId != null ? String(studentId).trim() : null,
            semester:
              role === "student" && semester != null ? Number(semester) : null,
            section:
              role === "student" && section != null ? String(section) : null,
            academicYear:
              role === "student" && academicYear != null
                ? String(academicYear)
                : null,
          });

          createdUsers.push({
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            studentId: user.studentId,
            semester: user.semester,
            section: user.section,
            academicYear: user.academicYear,
          });
        } catch (err) {
          errors.push({ index: i, email, message: err.message });
        }
      }

      res.status(201).json({
        created: createdUsers.length,
        createdUsers,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);
