const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

router.get("/student", verifyToken, requireRole("student", "teacher", "admin"), (req, res) => {
  res.json({ message: "Hello student-level user", user: req.user });
});

router.get("/teacher", verifyToken, requireRole("teacher", "admin"), (req, res) => {
  res.json({ message: "Hello teacher-level user", user: req.user });
});

router.get("/admin", verifyToken, requireRole("admin"), (req, res) => {
  res.json({ message: "Hello admin user", user: req.user });
});

module.exports = router;
