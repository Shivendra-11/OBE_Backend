const Exam = require("../models/Exam");
const Question = require("../models/Question");
const StudentMark = require("../models/StudentMark");
const Course = require("../models/Course");
const attainmentService = require("../services/attainment.service");

exports.createExam = async (req, res) => {
  try {
    let { courseId, courseCode, name, type } = req.body;
    if ((!courseId && !courseCode) || !name) return res.status(400).json({ message: "courseId/courseCode and name required" });

    if (!courseId && courseCode) {
      const c = await Course.findOne({ code: courseCode });
      if (!c) return res.status(404).json({ message: "Course not found for provided courseCode" });
      courseId = c._id;
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // teacher can only create exams for their assigned courses
    if (req.user && req.user.id && course.assignedTeacher && course.assignedTeacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not assigned to this course" });
    }

    const exam = await Exam.create({ name, course: courseId, type });
    res.status(201).json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    let { examId, CO, maxMarks } = req.body;
    if (!examId || CO == null || maxMarks == null) return res.status(400).json({ message: "examId (or courseCode), CO, maxMarks required" });

    // If examId is not a 24-char hex, treat it as a course code and resolve an exam for that course
    if (!/^[0-9a-fA-F]{24}$/.test(String(examId))) {
      // examId contains something like a course code (e.g., "CS101")
      const course = await Course.findOne({ code: examId });
      if (!course) return res.status(404).json({ message: "Course not found for provided examId/courseCode" });
      // find an exam for that course (take the most recent)
      const examDoc = await Exam.findOne({ course: course._id }).sort({ _id: -1 });
      if (!examDoc) return res.status(404).json({ message: "No exam found for the provided course" });
      examId = examDoc._id;
    }

    const exam = await Exam.findById(examId).populate('course');
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // check teacher assignment
    if (exam.course.assignedTeacher && req.user && req.user.id && exam.course.assignedTeacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not assigned to this course" });
    }

    const q = await Question.create({ exam: examId, CO, maxMarks });
    res.status(201).json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.enterMarks = async (req, res) => {
  try {
    // body: [{ studentId, questionId, marksObtained }, ...]
    const entries = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ message: "Array of marks expected" });
    const created = [];
    for (const e of entries) {
      const { studentId, questionId, marksObtained } = e;
      if (!studentId || !questionId || marksObtained == null) continue;
      // upsert: if exists, update
      const existing = await StudentMark.findOne({ student: studentId, question: questionId });
      if (existing) {
        existing.marksObtained = marksObtained;
        await existing.save();
        created.push(existing);
      } else {
        const m = await StudentMark.create({ student: studentId, question: questionId, marksObtained });
        created.push(m);
      }
    }
    res.json({ count: created.length, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.calculateExamCO = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    // check teacher assignment
    const course = await Course.findById(exam.course);
    if (course.assignedTeacher && req.user && req.user.id && course.assignedTeacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not assigned to this course" });
    }

    await attainmentService.calculateExamCO(exam);
    res.json({ message: "Exam CO attainment calculated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.calculateCTFinal = async (req, res) => {
  try {
    let { courseId } = req.params;
    // allow course code in param
    if (courseId && !/^[0-9a-fA-F]{24}$/.test(courseId)) {
      const c = await Course.findOne({ code: courseId });
      if (!c) return res.status(404).json({ message: "Course not found" });
      courseId = c._id;
    }
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.assignedTeacher && req.user && req.user.id && course.assignedTeacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await attainmentService.calculateCTFinal(courseId);
    res.json({ message: "CT_FINAL calculated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.calculateAssignmentFinal = async (req, res) => {
  try {
    let { courseId } = req.params;
    if (courseId && !/^[0-9a-fA-F]{24}$/.test(courseId)) {
      const c = await Course.findOne({ code: courseId });
      if (!c) return res.status(404).json({ message: "Course not found" });
      courseId = c._id;
    }
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.assignedTeacher && req.user && req.user.id && course.assignedTeacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await attainmentService.calculateAssignmentFinal(courseId);
    res.json({ message: "ASSIGNMENT_FINAL calculated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.calculateOverall = async (req, res) => {
  try {
    let { courseId } = req.params;
    if (courseId && !/^[0-9a-fA-F]{24}$/.test(courseId)) {
      const c = await Course.findOne({ code: courseId });
      if (!c) return res.status(404).json({ message: "Course not found" });
      courseId = c._id;
    }
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.assignedTeacher && req.user && req.user.id && course.assignedTeacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await attainmentService.calculateOverall(courseId);
    res.json({ message: "OVERALL calculated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
