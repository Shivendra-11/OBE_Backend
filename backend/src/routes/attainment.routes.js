const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam");
const attainmentService = require("../services/attainment.service");

router.post("/calculate/:examId", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    await attainmentService.calculateExamCO(exam);
    res.json({ message: "CO attainment calculation started/completed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
