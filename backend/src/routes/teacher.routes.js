const express = require("express");
const router = express.Router();
const teacher = require("../controllers/teacher.controller");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

router.post("/exam", verifyToken, requireRole("teacher","admin"), teacher.createExam);
router.post("/exam-with-questions", verifyToken, requireRole("teacher","admin"), teacher.createExamWithQuestions);
router.post("/question", verifyToken, requireRole("teacher","admin"), teacher.createQuestion);
router.post("/question/bulk", verifyToken, requireRole("teacher","admin"), teacher.createQuestionBulk);
router.post("/marks", verifyToken, requireRole("teacher","admin"), teacher.enterMarks);

// Marksheet UX: choose exam -> fetch students + questions + existing marks, then submit updates
router.get("/marksheet/:examId", verifyToken, requireRole("teacher","admin"), teacher.getExamMarksheet);
router.post("/marksheet/:examId", verifyToken, requireRole("teacher","admin"), teacher.submitExamMarksheet);

router.post("/exam-co/:examId", verifyToken, requireRole("teacher","admin"), teacher.calculateExamCO);
router.get("/exam-co/:examId", verifyToken, requireRole("teacher","admin"), teacher.getExamCOAttainment);
router.post("/ct-final/:courseId", verifyToken, requireRole("teacher","admin"), teacher.calculateCTFinal);
router.post("/assignment-final/:courseId", verifyToken, requireRole("teacher","admin"), teacher.calculateAssignmentFinal);
router.post("/overall/:courseId", verifyToken, requireRole("teacher","admin"), teacher.calculateOverall);
router.get("/course-attainment/:courseId", verifyToken, requireRole("teacher","admin"), teacher.getCourseAttainment);

module.exports = router;
