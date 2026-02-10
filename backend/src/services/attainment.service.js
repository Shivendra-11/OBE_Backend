const Question = require("../models/Question");
const StudentMark = require("../models/StudentMark");
const COAttainment = require("../models/COAttainment");
const CourseAttainment = require("../models/CourseAttainment");
const Course = require("../models/Course");

const getLevel = p => (p >= 70 ? 3 : p >= 60 ? 2 : p >= 50 ? 1 : 0);

exports.calculateExamCO = async (exam, options = {}) => {
  const section = options.section == null ? null : String(options.section).trim() || null;
  const courseMeta = await Course.findById(exam.course).select("semester academicYear").lean();

  const questions = await Question.find({ exam: exam._id });
  const map = {};

  questions.forEach(q => {
    if (!map[q.CO]) map[q.CO] = { total: 0, qIds: [] };
    map[q.CO].total += q.maxMarks;
    map[q.CO].qIds.push(q._id);
  });

  for (const co in map) {
    const benchmark = map[co].total * 0.5;

    const matchStudent = { "studentDoc.role": "student" };
    if (courseMeta && courseMeta.semester != null) matchStudent["studentDoc.semester"] = courseMeta.semester;
    if (courseMeta && courseMeta.academicYear != null) matchStudent["studentDoc.academicYear"] = courseMeta.academicYear;
    if (section) matchStudent["studentDoc.section"] = section;

    const marks = await StudentMark.aggregate([
      { $match: { question: { $in: map[co].qIds } } },
      { $lookup: { from: "users", localField: "student", foreignField: "_id", as: "studentDoc" } },
      { $unwind: "$studentDoc" },
      { $match: matchStudent },
      { $group: { _id: "$student", total: { $sum: "$marksObtained" } } }
    ]);

    let Y = 0, N = 0;
    marks.forEach(m => (m.total >= benchmark ? Y++ : N++));

    const percent = (Y / (Y + N)) * 100 || 0;

    await COAttainment.findOneAndUpdate(
      { course: exam.course, exam: exam._id, examType: exam.name, section: section, CO: Number(co) },
      {
        course: exam.course,
        exam: exam._id,
        examType: exam.name,
        section: section,
        CO: Number(co),
        Y,
        N,
        percentage: percent,
        level: getLevel(percent)
      },
      { upsert: true, new: true }
    );
  }
};

// Calculate CT_FINAL for a course (aggregate across CT-type exams)
exports.calculateCTFinal = async (courseId, options = {}) => {
  const section = options.section == null ? null : String(options.section).trim() || null;
  const courseMeta = await Course.findById(courseId).select("semester academicYear").lean();

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

  const matchStudent = { "studentDoc.role": "student" };
  if (courseMeta && courseMeta.semester != null) matchStudent["studentDoc.semester"] = courseMeta.semester;
  if (courseMeta && courseMeta.academicYear != null) matchStudent["studentDoc.academicYear"] = courseMeta.academicYear;
  if (section) matchStudent["studentDoc.section"] = section;

  const marks = await StudentMark.aggregate([
    { $match: { question: { $in: qIds } } },
    { $lookup: { from: "users", localField: "student", foreignField: "_id", as: "studentDoc" } },
    { $unwind: "$studentDoc" },
    { $match: matchStudent },
    { $group: { _id: "$student", total: { $sum: "$marksObtained" } } }
  ]);

  let Y = 0, N = 0;
  marks.forEach(m => (m.total >= benchmark ? Y++ : N++));
  const percent = (Y / (Y + N)) * 100 || 0;

  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "CT_FINAL", section: section },
    { course: courseId, type: "CT_FINAL", section: section, totalY: Y, totalN: N, percentage: percent, level: getLevel(percent) },
    { upsert: true, new: true }
  );
};

// Calculate ASSIGNMENT_FINAL for a course (combine assignment exams)
exports.calculateAssignmentFinal = async (courseId, options = {}) => {
  const section = options.section == null ? null : String(options.section).trim() || null;
  const courseMeta = await Course.findById(courseId).select("semester academicYear").lean();

  const Exam = require("../models/Exam");
  const Question = require("../models/Question");
  const StudentMark = require("../models/StudentMark");

  const exams = await Exam.find({ course: courseId, type: "ASSIGNMENT" });
  const examIds = exams.map(e => e._id);
  const questions = await Question.find({ exam: { $in: examIds } });
  const qIds = questions.map(q => q._id);
  const totalMarks = questions.reduce((s, q) => s + (q.maxMarks || 0), 0);
  const benchmark = totalMarks * 0.5;

  const matchStudent = { "studentDoc.role": "student" };
  if (courseMeta && courseMeta.semester != null) matchStudent["studentDoc.semester"] = courseMeta.semester;
  if (courseMeta && courseMeta.academicYear != null) matchStudent["studentDoc.academicYear"] = courseMeta.academicYear;
  if (section) matchStudent["studentDoc.section"] = section;

  const marks = await StudentMark.aggregate([
    { $match: { question: { $in: qIds } } },
    { $lookup: { from: "users", localField: "student", foreignField: "_id", as: "studentDoc" } },
    { $unwind: "$studentDoc" },
    { $match: matchStudent },
    { $group: { _id: "$student", total: { $sum: "$marksObtained" } } }
  ]);

  let Y = 0, N = 0;
  marks.forEach(m => (m.total >= benchmark ? Y++ : N++));
  const percent = (Y / (Y + N)) * 100 || 0;

  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "ASSIGNMENT_FINAL", section: section },
    { course: courseId, type: "ASSIGNMENT_FINAL", section: section, totalY: Y, totalN: N, percentage: percent, level: getLevel(percent) },
    { upsert: true, new: true }
  );
};

// Calculate OVERALL course attainment as average of CT_FINAL and ASSIGNMENT_FINAL levels
exports.calculateOverall = async (courseId, options = {}) => {
  const section = options.section == null ? null : String(options.section).trim() || null;

  const ct = await CourseAttainment.findOne({ course: courseId, type: "CT_FINAL", section: section });
  const ass = await CourseAttainment.findOne({ course: courseId, type: "ASSIGNMENT_FINAL", section: section });
  const ctLevel = ct ? ct.level : 0;
  const assLevel = ass ? ass.level : 0;
  const avg = Math.round(((ctLevel + assLevel) / 2) || 0);
  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "OVERALL", section: section },
    { course: courseId, type: "OVERALL", section: section, totalY: null, totalN: null, percentage: null, level: avg },
    { upsert: true, new: true }
  );
};
