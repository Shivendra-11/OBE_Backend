const express = require("express");
const router = express.Router();
const teacher = require("../controllers/teacher.controller");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

router.post("/exam", verifyToken, requireRole("teacher","admin"), teacher.createExam);
router.post("/question", verifyToken, requireRole("teacher","admin"), teacher.createQuestion);
router.post("/marks", verifyToken, requireRole("teacher","admin"), teacher.enterMarks);
router.post("/exam-co/:examId", verifyToken, requireRole("teacher","admin"), teacher.calculateExamCO);
router.post("/ct-final/:courseId", verifyToken, requireRole("teacher","admin"), teacher.calculateCTFinal);
router.post("/assignment-final/:courseId", verifyToken, requireRole("teacher","admin"), teacher.calculateAssignmentFinal);
router.post("/overall/:courseId", verifyToken, requireRole("teacher","admin"), teacher.calculateOverall);

module.exports = router;
