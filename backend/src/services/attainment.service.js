const Question = require("../models/Question");
const StudentMark = require("../models/StudentMark");
const COAttainment = require("../models/COAttainment");
const CourseAttainment = require("../models/CourseAttainment");

const getLevel = p => (p >= 70 ? 3 : p >= 60 ? 2 : p >= 50 ? 1 : 0);

exports.calculateExamCO = async (exam) => {
  const questions = await Question.find({ exam: exam._id });
  const map = {};

  questions.forEach(q => {
    if (!map[q.CO]) map[q.CO] = { total: 0, qIds: [] };
    map[q.CO].total += q.maxMarks;
    map[q.CO].qIds.push(q._id);
  });

  for (const co in map) {
    const benchmark = map[co].total * 0.5;

    const marks = await StudentMark.aggregate([
      { $match: { question: { $in: map[co].qIds } } },
      { $group: { _id: "$student", total: { $sum: "$marksObtained" } } }
    ]);

    let Y = 0, N = 0;
    marks.forEach(m => (m.total >= benchmark ? Y++ : N++));

    const percent = (Y / (Y + N)) * 100 || 0;

    await COAttainment.create({
      course: exam.course,
      examType: exam.name,
      CO: Number(co),
      Y,
      N,
      percentage: percent,
      level: getLevel(percent)
    });
  }
};

// Calculate CT_FINAL for a course (aggregate across CT-type exams)
exports.calculateCTFinal = async (courseId) => {
  // CT-type exams are PRE_CT, CT1, CT2, PUE
  const Exam = require("../models/Exam");
  const Question = require("../models/Question");
  const StudentMark = require("../models/StudentMark");

  const ctTypes = ["PRE_CT","CT1","CT2","PUE"];
  const exams = await Exam.find({ course: courseId, type: { $in: ctTypes } });
  const examIds = exams.map(e => e._id);
  const questions = await Question.find({ exam: { $in: examIds } });
  const qIds = questions.map(q => q._id);
  const totalMarks = questions.reduce((s, q) => s + (q.maxMarks || 0), 0);
  const benchmark = totalMarks * 0.5;

  const marks = await StudentMark.aggregate([
    { $match: { question: { $in: qIds } } },
    { $group: { _id: "$student", total: { $sum: "$marksObtained" } } }
  ]);

  let Y = 0, N = 0;
  marks.forEach(m => (m.total >= benchmark ? Y++ : N++));
  const percent = (Y / (Y + N)) * 100 || 0;

  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "CT_FINAL" },
    { course: courseId, type: "CT_FINAL", totalY: Y, totalN: N, percentage: percent, level: getLevel(percent) },
    { upsert: true, new: true }
  );
};

// Calculate ASSIGNMENT_FINAL for a course (combine assignment exams)
exports.calculateAssignmentFinal = async (courseId) => {
  const Exam = require("../models/Exam");
  const Question = require("../models/Question");
  const StudentMark = require("../models/StudentMark");

  const exams = await Exam.find({ course: courseId, type: "ASSIGNMENT" });
  const examIds = exams.map(e => e._id);
  const questions = await Question.find({ exam: { $in: examIds } });
  const qIds = questions.map(q => q._id);
  const totalMarks = questions.reduce((s, q) => s + (q.maxMarks || 0), 0);
  const benchmark = totalMarks * 0.5;

  const marks = await StudentMark.aggregate([
    { $match: { question: { $in: qIds } } },
    { $group: { _id: "$student", total: { $sum: "$marksObtained" } } }
  ]);

  let Y = 0, N = 0;
  marks.forEach(m => (m.total >= benchmark ? Y++ : N++));
  const percent = (Y / (Y + N)) * 100 || 0;

  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "ASSIGNMENT_FINAL" },
    { course: courseId, type: "ASSIGNMENT_FINAL", totalY: Y, totalN: N, percentage: percent, level: getLevel(percent) },
    { upsert: true, new: true }
  );
};

// Calculate OVERALL course attainment as average of CT_FINAL and ASSIGNMENT_FINAL levels
exports.calculateOverall = async (courseId) => {
  const ct = await CourseAttainment.findOne({ course: courseId, type: "CT_FINAL" });
  const ass = await CourseAttainment.findOne({ course: courseId, type: "ASSIGNMENT_FINAL" });
  const ctLevel = ct ? ct.level : 0;
  const assLevel = ass ? ass.level : 0;
  const avg = Math.round(((ctLevel + assLevel) / 2) || 0);
  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "OVERALL" },
    { course: courseId, type: "OVERALL", totalY: null, totalN: null, percentage: null, level: avg },
    { upsert: true, new: true }
  );
};
