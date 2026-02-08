const express = require("express");
const router = express.Router();
const student = require("../controllers/student.controller");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

router.get("/marks/me", verifyToken, requireRole("student","teacher","admin"), student.getMyMarks);
router.get("/attainment/me", verifyToken, requireRole("student","teacher","admin"), student.getMyAttainment);

module.exports = router;
