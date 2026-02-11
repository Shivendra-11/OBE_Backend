const Question = require("../models/Question");
const StudentMark = require("../models/StudentMark");
const COAttainment = require("../models/COAttainment");
const CourseAttainment = require("../models/CourseAttainment");
const Course = require("../models/Course");

const getLevel = (p) => (p >= 70 ? 3 : p >= 60 ? 2 : p >= 50 ? 1 : 0);

exports.calculateExamCO = async (exam, options = {}) => {
  const section =
    options.section == null ? null : String(options.section).trim() || null;
  const courseMeta = await Course.findById(exam.course)
    .select("semester academicYear")
    .lean();

  const questions = await Question.find({ exam: exam._id });
  const map = {};

  questions.forEach((q) => {
    if (!map[q.CO]) map[q.CO] = { total: 0, qIds: [] };
    map[q.CO].total += q.maxMarks;
    map[q.CO].qIds.push(q._id);
  });

  for (const co in map) {
    const benchmark = map[co].total * 0.5;

    const matchStudent = { "studentDoc.role": "student" };
    if (courseMeta && courseMeta.semester != null)
      matchStudent["studentDoc.semester"] = courseMeta.semester;
    if (courseMeta && courseMeta.academicYear != null)
      matchStudent["studentDoc.academicYear"] = courseMeta.academicYear;
    if (section) matchStudent["studentDoc.section"] = section;

    const marks = await StudentMark.aggregate([
      { $match: { question: { $in: map[co].qIds } } },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentDoc",
        },
      },
      { $unwind: "$studentDoc" },
      { $match: matchStudent },
      { $group: { _id: "$student", total: { $sum: "$marksObtained" } } },
    ]);

    let Y = 0,
      N = 0;
    marks.forEach((m) => (m.total >= benchmark ? Y++ : N++));

    const percent = (Y / (Y + N)) * 100 || 0;

    await COAttainment.findOneAndUpdate(
      {
        course: exam.course,
        exam: exam._id,
        examType: exam.name,
        section: section,
        CO: Number(co),
      },
      {
        course: exam.course,
        exam: exam._id,
        examType: exam.name,
        section: section,
        CO: Number(co),
        Y,
        N,
        percentage: percent,
        level: getLevel(percent),
      },
      { upsert: true, new: true },
    );
  }
};

// Calculate CT_FINAL for a course (aggregate across CT-type exams)
exports.calculateCTFinal = async (courseId, options = {}) => {
  const section =
    options.section == null ? null : String(options.section).trim() || null;
  const courseMeta = await Course.findById(courseId)
    .select("semester academicYear")
    .lean();

  // CT-type exams are PRE_CT, CT1, CT2, PUE
  const Exam = require("../models/Exam");
  const Question = require("../models/Question");
  const StudentMark = require("../models/StudentMark");

  const ctTypes = ["PRE_CT", "CT1", "CT2", "PUE"];
  const exams = await Exam.find({ course: courseId, type: { $in: ctTypes } });

  // Accumulate Y/N across all exams and COs
  let totalY = 0;
  let totalN = 0;

  // Prepare student match base
  const baseMatchStudent = { "studentDoc.role": "student" };
  if (courseMeta && courseMeta.semester != null)
    baseMatchStudent["studentDoc.semester"] = courseMeta.semester;
  if (courseMeta && courseMeta.academicYear != null)
    baseMatchStudent["studentDoc.academicYear"] = courseMeta.academicYear;
  if (section) baseMatchStudent["studentDoc.section"] = section;

  for (const exam of exams) {
    // Group questions of this exam by CO
    const qs = await Question.find({ exam: exam._id })
      .select("_id CO maxMarks")
      .lean();
    const coMap = {};
    qs.forEach((q) => {
      if (q.CO == null) return;
      const key = String(q.CO);
      if (!coMap[key]) coMap[key] = { qIds: [], totalMarks: 0 };
      coMap[key].qIds.push(q._id);
      coMap[key].totalMarks += q.maxMarks || 0;
    });

    // For each CO in this exam, compute Y/N (students meeting benchmark for that CO in this exam)
    for (const coKey of Object.keys(coMap)) {
      const entry = coMap[coKey];
      if (entry.qIds.length === 0 || entry.totalMarks === 0) continue;
      const benchmark = entry.totalMarks * 0.5;

      const matchStudent = Object.assign({}, baseMatchStudent);

      const marksAgg = await StudentMark.aggregate([
        { $match: { question: { $in: entry.qIds } } },
        {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "studentDoc",
          },
        },
        { $unwind: "$studentDoc" },
        { $match: matchStudent },
        { $group: { _id: "$student", total: { $sum: "$marksObtained" } } },
      ]);

      // Count Y/N for this exam-CO
      let Y = 0,
        N = 0;
      marksAgg.forEach((m) => (m.total >= benchmark ? Y++ : N++));
      totalY += Y;
      totalN += N;
    }
  }

  const percent = (totalY / (totalY + totalN)) * 100 || 0;

  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "CT_FINAL", section: section },
    {
      course: courseId,
      type: "CT_FINAL",
      section: section,
      totalY: totalY,
      totalN: totalN,
      percentage: percent,
      level: getLevel(percent),
    },
    { upsert: true, new: true },
  );

  // Update combined OVERALL stored on Course document
  try {
    await exports.calculateOverallCombined(courseId);
  } catch (e) {
    console.error("Failed to update course.coAttainment after CT_FINAL:", e);
  }
};

// Calculate ASSIGNMENT_FINAL for a course (combine assignment exams)
exports.calculateAssignmentFinal = async (courseId, options = {}) => {
  const section =
    options.section == null ? null : String(options.section).trim() || null;
  const courseMeta = await Course.findById(courseId)
    .select("semester academicYear")
    .lean();

  const Exam = require("../models/Exam");
  const Question = require("../models/Question");
  const StudentMark = require("../models/StudentMark");

  const exams = await Exam.find({ course: courseId, type: "ASSIGNMENT" });

  // Accumulate Y/N across all assignment exams and COs
  let totalY = 0;
  let totalN = 0;

  const baseMatchStudent = { "studentDoc.role": "student" };
  if (courseMeta && courseMeta.semester != null)
    baseMatchStudent["studentDoc.semester"] = courseMeta.semester;
  if (courseMeta && courseMeta.academicYear != null)
    baseMatchStudent["studentDoc.academicYear"] = courseMeta.academicYear;
  if (section) baseMatchStudent["studentDoc.section"] = section;

  for (const exam of exams) {
    const qs = await Question.find({ exam: exam._id })
      .select("_id CO maxMarks")
      .lean();
    const coMap = {};
    qs.forEach((q) => {
      if (q.CO == null) return;
      const key = String(q.CO);
      if (!coMap[key]) coMap[key] = { qIds: [], totalMarks: 0 };
      coMap[key].qIds.push(q._id);
      coMap[key].totalMarks += q.maxMarks || 0;
    });

    for (const coKey of Object.keys(coMap)) {
      const entry = coMap[coKey];
      if (entry.qIds.length === 0 || entry.totalMarks === 0) continue;
      const benchmark = entry.totalMarks * 0.5;

      const matchStudent = Object.assign({}, baseMatchStudent);

      const marksAgg = await StudentMark.aggregate([
        { $match: { question: { $in: entry.qIds } } },
        {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "studentDoc",
          },
        },
        { $unwind: "$studentDoc" },
        { $match: matchStudent },
        { $group: { _id: "$student", total: { $sum: "$marksObtained" } } },
      ]);

      let Y = 0,
        N = 0;
      marksAgg.forEach((m) => (m.total >= benchmark ? Y++ : N++));
      totalY += Y;
      totalN += N;
    }
  }

  const percent = (totalY / (totalY + totalN)) * 100 || 0;

  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "ASSIGNMENT_FINAL", section: section },
    {
      course: courseId,
      type: "ASSIGNMENT_FINAL",
      section: section,
      totalY: totalY,
      totalN: totalN,
      percentage: percent,
      level: getLevel(percent),
    },
    { upsert: true, new: true },
  );

  // Update combined OVERALL stored on Course document
  try {
    await exports.calculateOverallCombined(courseId);
  } catch (e) {
    console.error(
      "Failed to update course.coAttainment after ASSIGNMENT_FINAL:",
      e,
    );
  }
};

// Calculate OVERALL course attainment as average of CT_FINAL and ASSIGNMENT_FINAL levels
exports.calculateOverall = async (courseId, options = {}) => {
  const section =
    options.section == null ? null : String(options.section).trim() || null;

  const ct = await CourseAttainment.findOne({
    course: courseId,
    type: "CT_FINAL",
    section: section,
  });
  const ass = await CourseAttainment.findOne({
    course: courseId,
    type: "ASSIGNMENT_FINAL",
    section: section,
  });
  const ctLevel = ct ? ct.level : 0;
  const assLevel = ass ? ass.level : 0;
  const avg = Math.round((ctLevel + assLevel) / 2 || 0);
  await CourseAttainment.findOneAndUpdate(
    { course: courseId, type: "OVERALL", section: section },
    {
      course: courseId,
      type: "OVERALL",
      section: section,
      totalY: null,
      totalN: null,
      percentage: null,
      level: avg,
    },
    { upsert: true, new: true },
  );
};

// Calculate combined OVERALL across all sections and persist into Course.coAttainment
exports.calculateOverallCombined = async (courseId) => {
  // gather CT and ASSIGNMENT CourseAttainment docs across sections
  const ctDocs = await CourseAttainment.find({
    course: courseId,
    type: "CT_FINAL",
  }).lean();
  const assDocs = await CourseAttainment.find({
    course: courseId,
    type: "ASSIGNMENT_FINAL",
  }).lean();

  let ctY = 0,
    ctN = 0;
  ctDocs.forEach((d) => {
    ctY += Number(d.totalY || 0);
    ctN += Number(d.totalN || 0);
  });
  const ctPct = (ctY / (ctY + ctN)) * 100 || 0;
  const ctLevel = getLevel(ctPct);

  let assY = 0,
    assN = 0;
  assDocs.forEach((d) => {
    assY += Number(d.totalY || 0);
    assN += Number(d.totalN || 0);
  });
  const assPct = (assY / (assY + assN)) * 100 || 0;
  const assLevel = getLevel(assPct);

  const finalLevel = Math.round((ctLevel + assLevel) / 2 || 0);

  // Persist into Course.coAttainment
  try {
    await Course.findByIdAndUpdate(
      courseId,
      {
        $set: {
          coAttainment: {
            overallLevel: finalLevel,
            CT_FINAL: {
              totalY: ctY || null,
              totalN: ctN || null,
              percentage: ctPct || null,
              level: ctLevel || null,
            },
            ASSIGNMENT_FINAL: {
              totalY: assY || null,
              totalN: assN || null,
              percentage: assPct || null,
              level: assLevel || null,
            },
          },
        },
      },
      { new: true },
    );
  } catch (e) {
    console.error("Failed to persist coAttainment on Course:", e);
  }

  return {
    CT_FINAL: { totalY: ctY, totalN: ctN, percentage: ctPct, level: ctLevel },
    ASSIGNMENT_FINAL: {
      totalY: assY,
      totalN: assN,
      percentage: assPct,
      level: assLevel,
    },
    OVERALL: { level: finalLevel },
  };
};
