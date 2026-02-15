const Exam = require("../models/Exam");
const Question = require("../models/Question");
const StudentMark = require("../models/StudentMark");
const Course = require("../models/Course");
const User = require("../models/User");
const COAttainment = require("../models/COAttainment");
const CourseAttainment = require("../models/CourseAttainment");
const attainmentService = require("../services/attainment.service");

const normalizeSection = (s) => (s == null ? null : String(s).trim());

const getTeacherSectionsForCourse = (course, teacherId) => {
  const sections = [];
  if (!course) return sections;
  const st = Array.isArray(course.sectionTeachers)
    ? course.sectionTeachers
    : [];
  for (const entry of st) {
    if (
      entry &&
      entry.teacher &&
      entry.teacher.toString() === String(teacherId)
    ) {
      if (entry.section != null) sections.push(String(entry.section));
    }
  }
  // Legacy single-teacher assignment => require explicit section parameter
  if (
    sections.length === 0 &&
    course.assignedTeacher &&
    course.assignedTeacher.toString() === String(teacherId)
  ) {
    return ["__LEGACY__"]; // special marker (requires explicit section)
  }
  return sections;
};

const ensureTeacherAssignedToCourse = async (req, course) => {
  const user = await User.findById(req.user.id).select("role").lean();
  if (!user) return { ok: false, status: 401, message: "Unauthorized" };
  if (user.role === "admin") return { ok: true, role: "admin" };
  const sections = getTeacherSectionsForCourse(course, req.user.id);
  if (!sections.length)
    return {
      ok: false,
      status: 403,
      message: "Forbidden: not assigned to this course",
    };
  return { ok: true, role: "teacher", sections };
};

const resolveTeacherSection = ({ role, sections }, requestedSection) => {
  if (role === "admin")
    return { ok: true, section: normalizeSection(requestedSection) };
  // legacy assignment: require the teacher to provide an explicit section
  if (sections && sections.length === 1 && sections[0] === "__LEGACY__") {
    const normalized = normalizeSection(requestedSection);
    if (!normalized)
      return {
        ok: false,
        status: 400,
        message: "section required (legacy assignment)",
      };
    return { ok: true, section: normalized };
  }

  const normalized = normalizeSection(requestedSection);
  if (normalized) {
    const allowed = (sections || []).some(
      (s) => String(s).toLowerCase() === normalized.toLowerCase(),
    );
    if (!allowed)
      return {
        ok: false,
        status: 403,
        message: "Forbidden: not assigned to this section",
      };
    return { ok: true, section: normalized };
  }

  if (!sections || sections.length === 0)
    return { ok: false, status: 403, message: "Forbidden" };
  if (sections.length > 1)
    return {
      ok: false,
      status: 400,
      message: "section required (assigned to multiple sections)",
    };
  return { ok: true, section: sections[0] };
};

exports.listAssignedCourses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    // Find courses where sectionTeachers.teacher matches teacherId
    const courses = await Course.find({
      "sectionTeachers.teacher": teacherId
    }).select("code name semester academicYear sectionTeachers");

    // Enhance course object to show only assigned sections for this teacher
    const result = courses.map(course => {
      const mySections = getTeacherSectionsForCourse(course, teacherId);
      return {
        _id: course._id,
        code: course.code,
        name: course.name,
        semester: course.semester,
        academicYear: course.academicYear,
        sections: mySections
      };
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getExamsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    // Check assignment
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok) return res.status(authz.status).json({ message: authz.message });

    const exams = await Exam.find({ course: courseId }).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createExam = async (req, res) => {
  try {
    let { courseId, courseCode, name, type } = req.body;
    if ((!courseId && !courseCode) || !name)
      return res
        .status(400)
        .json({ message: "courseId/courseCode and name required" });

    if (!courseId && courseCode) {
      const c = await Course.findOne({ code: courseCode });
      if (!c)
        return res
          .status(404)
          .json({ message: "Course not found for provided courseCode" });
      courseId = c._id;
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // teacher can only create exams for courses where they are assigned to at least one section
    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });

    const exam = await Exam.create({ name, course: courseId, type });
    res.status(201).json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getExamDetails = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate("course", "code name semester academicYear");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const authz = await ensureTeacherAssignedToCourse(req, exam.course);
    if (!authz.ok) return res.status(authz.status).json({ message: authz.message });

    const questions = await Question.find({ exam: examId }).sort({ _id: 1 }); // Sort by creation approx

    res.json({ exam, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createExamWithQuestions = async (req, res) => {
  try {
    let { courseId, courseCode, name, type, questions } = req.body;
    if (
      (!courseId && !courseCode) ||
      !name ||
      !type ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res
        .status(400)
        .json({
          message: "courseId/courseCode, name, type and questions[] required",
        });
    }

    if (!courseId && courseCode) {
      const c = await Course.findOne({ code: courseCode });
      if (!c)
        return res
          .status(404)
          .json({ message: "Course not found for provided courseCode" });
      courseId = c._id;
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });

    const exam = await Exam.create({ name, course: courseId, type });

    const docs = questions
      .filter((q) => q && q.CO != null && q.maxMarks != null)
      .map((q) => ({
        exam: exam._id,
        CO: Number(q.CO),
        maxMarks: Number(q.maxMarks),
      }));

    if (docs.length === 0) {
      return res.status(400).json({ message: "No valid questions" });
    }

    const createdQuestions = await Question.insertMany(docs, {
      ordered: false,
    });
    res
      .status(201)
      .json({
        exam,
        count: createdQuestions.length,
        questions: createdQuestions,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    let { examId, CO, maxMarks } = req.body;
    if (!examId || CO == null || maxMarks == null)
      return res
        .status(400)
        .json({ message: "examId (or courseCode), CO, maxMarks required" });

    // If examId is not a 24-char hex, treat it as a course code and resolve an exam for that course
    if (!/^[0-9a-fA-F]{24}$/.test(String(examId))) {
      // examId contains something like a course code (e.g., "CS101")
      const course = await Course.findOne({ code: examId });
      if (!course)
        return res
          .status(404)
          .json({ message: "Course not found for provided examId/courseCode" });
      // find an exam for that course (take the most recent)
      const examDoc = await Exam.findOne({ course: course._id }).sort({
        _id: -1,
      });
      if (!examDoc)
        return res
          .status(404)
          .json({ message: "No exam found for the provided course" });
      examId = examDoc._id;
    }

    const exam = await Exam.findById(examId).populate("course");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // check teacher assignment (any section in this course)
    const authz = await ensureTeacherAssignedToCourse(req, exam.course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });

    const q = await Question.create({ exam: examId, CO, maxMarks });
    res.status(201).json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createQuestionBulk = async (req, res) => {
  try {
    let { examId, questions } = req.body;
    if (!examId || !Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "examId and questions array required" });
    }

    // If examId is not a 24-char hex, treat it as a course code and resolve an exam for that course
    if (!/^[0-9a-fA-F]{24}$/.test(String(examId))) {
      const course = await Course.findOne({ code: examId });
      if (!course)
        return res
          .status(404)
          .json({ message: "Course not found for provided examId/courseCode" });
      const examDoc = await Exam.findOne({ course: course._id }).sort({
        _id: -1,
      });
      if (!examDoc)
        return res
          .status(404)
          .json({ message: "No exam found for the provided course" });
      examId = examDoc._id;
    }

    const exam = await Exam.findById(examId).populate("course");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // check teacher assignment (any section in this course)
    const authz = await ensureTeacherAssignedToCourse(req, exam.course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });

    const docs = questions
      .filter((q) => q && q.CO != null && q.maxMarks != null)
      .map((q) => ({
        exam: exam._id,
        CO: Number(q.CO),
        maxMarks: Number(q.maxMarks),
      }));

    if (docs.length === 0)
      return res.status(400).json({ message: "No valid questions" });

    const created = await Question.insertMany(docs, { ordered: false });
    res
      .status(201)
      .json({ count: created.length, examId: exam._id, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findById(questionId).populate({
      path: "exam",
      select: "course"
    });
    
    if (!question) return res.status(404).json({ message: "Question not found" });
    
    // Check auth
    if (!question.exam || !question.exam.course) {
       // Orphaned question, just delete if admin? Or teacher assigned?
       // Safe delete
       await Question.findByIdAndDelete(questionId);
       return res.json({ message: "Question deleted" });
    }

    const authz = await ensureTeacherAssignedToCourse(req, question.exam.course);
    if (!authz.ok) return res.status(authz.status).json({ message: authz.message });

    await Question.findByIdAndDelete(questionId);
    // Also cleanup marks? Ideally yes
    await StudentMark.deleteMany({ question: questionId });

    res.json({ message: "Question deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.enterMarks = async (req, res) => {
  try {
    // body: [{ studentId, questionId, marksObtained }, ...]
    const entries = req.body;
    if (!Array.isArray(entries))
      return res.status(400).json({ message: "Array of marks expected" });

    // Determine course from the first valid question
    const first = entries.find((e) => e && e.questionId);
    if (!first)
      return res
        .status(400)
        .json({ message: "At least one questionId required" });

    const firstQuestion = await Question.findById(first.questionId).populate({
      path: "exam",
      select: "course",
    });
    if (!firstQuestion || !firstQuestion.exam)
      return res.status(400).json({ message: "Invalid questionId" });
    const course = await Course.findById(firstQuestion.exam.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });

    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });
    const section = sectionPick.section;

    const created = [];
    for (const e of entries) {
      const { studentId, questionId, marksObtained } = e;
      if (!studentId || !questionId || marksObtained == null) continue;

      // Ensure each mark entry belongs to the same course
      const q = await Question.findById(questionId).populate({
        path: "exam",
        select: "course",
      });
      if (!q || !q.exam) continue;
      if (q.exam.course.toString() !== course._id.toString()) {
        return res
          .status(400)
          .json({ message: "All entries must belong to the same course" });
      }

      // Teachers can only enter marks for students in their assigned section.
      // (Admins can enter marks for any section.)
      if (authz.role !== "admin" && section) {
        const stu = await User.findById(studentId)
          .select("role semester section academicYear")
          .lean();
        if (!stu || stu.role !== "student")
          return res.status(400).json({ message: "Invalid student" });
        if (stu.section == null)
          return res.status(400).json({ message: "Student section not set" });
        if (
          String(stu.section).toLowerCase() !== String(section).toLowerCase()
        ) {
          return res
            .status(403)
            .json({ message: "Forbidden: student not in your section" });
        }
      }

      // upsert: if exists, update
      const existing = await StudentMark.findOne({
        student: studentId,
        question: questionId,
      });
      if (existing) {
        existing.marksObtained = marksObtained;
        await existing.save();
        created.push(existing);
      } else {
        const m = await StudentMark.create({
          student: studentId,
          question: questionId,
          marksObtained,
        });
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

    const course = await Course.findById(exam.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });

    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });

    await attainmentService.calculateExamCO(exam, {
      section: sectionPick.section,
    });
    res.json({
      message: "Exam CO attainment calculated",
      section: sectionPick.section || null,
    });
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

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });
    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });

    await attainmentService.calculateCTFinal(courseId, {
      section: sectionPick.section,
    });
    res.json({
      message: "CT_FINAL calculated",
      section: sectionPick.section || null,
    });
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

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });
    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });

    await attainmentService.calculateAssignmentFinal(courseId, {
      section: sectionPick.section,
    });
    res.json({
      message: "ASSIGNMENT_FINAL calculated",
      section: sectionPick.section || null,
    });
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

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });
    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });

    await attainmentService.calculateOverall(courseId, {
      section: sectionPick.section,
    });
    res.json({
      message: "OVERALL calculated",
      section: sectionPick.section || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getExamCOAttainment = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const course = await Course.findById(exam.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });

    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });

    const records = await COAttainment.find({
      exam: exam._id,
      section: sectionPick.section || null,
    })
      .sort({ CO: 1 })
      .lean();

    res.json({
      examId: exam._id,
      courseId: course._id,
      section: sectionPick.section || null,
      data: records,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCourseAttainment = async (req, res) => {
  try {
    let { courseId } = req.params;
    if (courseId && !/^[0-9a-fA-F]{24}$/.test(courseId)) {
      const c = await Course.findOne({ code: courseId });
      if (!c) return res.status(404).json({ message: "Course not found" });
      courseId = c._id;
    }
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });
    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });

    const filter = { course: course._id, section: sectionPick.section || null };
    if (req.query.type) filter.type = String(req.query.type);

    const records = await CourseAttainment.find(filter).lean();
    res.json({
      courseId: course._id,
      section: sectionPick.section || null,
      data: records,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getExamMarksheet = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const course = await Course.findById(exam.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });
    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });
    const section = sectionPick.section;

    const questionsRaw = await Question.find({ exam: exam._id })
      .select("_id CO maxMarks")
      .lean();
    // Stable ordering: ObjectId time ordering is good enough here.
    const questionsSorted = questionsRaw.sort((a, b) =>
      String(a._id).localeCompare(String(b._id)),
    );
    const questions = questionsSorted.map((q, idx) => ({ ...q, qNo: idx + 1 }));
    const questionIds = questions.map((q) => q._id);

    const studentFilter = {
      role: "student",
      semester: course.semester,
      academicYear: course.academicYear,
    };
    if (section) studentFilter.section = section;

    const students = await User.find(studentFilter)
      .select("_id name email studentId section")
      .sort({ name: 1 })
      .lean();

    const studentIds = students.map((s) => s._id);
    const existingMarks = await StudentMark.find({
      student: { $in: studentIds },
      question: { $in: questionIds },
    })
      .select("student question marksObtained")
      .lean();

    const marksByStudent = new Map();
    for (const m of existingMarks) {
      const sid = m.student.toString();
      if (!marksByStudent.has(sid)) marksByStudent.set(sid, {});
      marksByStudent.get(sid)[m.question.toString()] = m.marksObtained;
    }

    const rows = students.map((s) => ({
      studentId: s._id,
      name: s.name,
      email: s.email,
      section: s.section,
      marks: marksByStudent.get(s._id.toString()) || {},
    }));

    res.json({
      exam: {
        id: exam._id,
        name: exam.name,
        type: exam.type,
        course: exam.course,
      },
      course: {
        id: course._id,
        code: course.code,
        name: course.name,
        semester: course.semester,
        academicYear: course.academicYear,
      },
      section: section || null,
      questions,
      students: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.submitExamMarksheet = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const course = await Course.findById(exam.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const authz = await ensureTeacherAssignedToCourse(req, course);
    if (!authz.ok)
      return res.status(authz.status).json({ message: authz.message });
    const sectionPick = resolveTeacherSection(authz, req.query.section);
    if (!sectionPick.ok)
      return res
        .status(sectionPick.status)
        .json({ message: sectionPick.message });
    const section = sectionPick.section;

    const questionsRaw = await Question.find({ exam: exam._id })
      .select("_id maxMarks")
      .lean();
    const questionsSorted = questionsRaw.sort((a, b) =>
      String(a._id).localeCompare(String(b._id)),
    );
    const questionIdByIndex = questionsSorted.map((q) => q._id.toString()); // index 0 => Q1
    const allowedQuestionIds = new Set(questionIdByIndex);

    const studentFilter = {
      role: "student",
      semester: course.semester,
      academicYear: course.academicYear,
    };
    if (authz.role !== "admin" && section) studentFilter.section = section;
    const allowedStudents = await User.find(studentFilter).select("_id").lean();
    const allowedStudentIds = new Set(
      allowedStudents.map((s) => s._id.toString()),
    );

    // payload supports either:
    // 1) entries: [{ studentId, marks: { [questionId]: number } }]
    // 2) entries: [{ studentId, marks: { "1": number, "2": number, ... } }]  (qNo)
    // 3) entries: [{ studentId, marks: [m1, m2, ...] }]  (array aligned to Q1..Qn)
    // 4) array of { studentId, questionId, marksObtained }
    // 5) array of { studentId, qNo, marksObtained }
    const { entries } = req.body;
    const raw = Array.isArray(entries)
      ? entries
      : Array.isArray(req.body)
        ? req.body
        : null;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ message: "entries array required" });
    }

    const ops = [];
    let skipped = 0;

    for (const item of raw) {
      if (!item) continue;

      // row-wise format
      if (item.studentId && item.marks && typeof item.marks === "object") {
        const sid = String(item.studentId);
        if (!allowedStudentIds.has(sid)) {
          skipped++;
          continue;
        }

        // marks as array aligned to Q1..Qn
        if (Array.isArray(item.marks)) {
          for (let i = 0; i < item.marks.length; i++) {
            const val = item.marks[i];
            if (val == null) continue;
            const qid = questionIdByIndex[i];
            if (!qid) {
              skipped++;
              continue;
            }
            ops.push({
              updateOne: {
                filter: { student: sid, question: qid },
                update: { $set: { marksObtained: Number(val) } },
                upsert: true,
              },
            });
          }
          continue;
        }

        // marks as object: either questionId keys OR qNo keys
        for (const [key, val] of Object.entries(item.marks)) {
          if (val == null) continue;

          // If key is a number => treat as qNo
          if (/^\d+$/.test(String(key))) {
            const qNo = Number(key);
            const qid = questionIdByIndex[qNo - 1];
            if (!qid) {
              skipped++;
              continue;
            }
            ops.push({
              updateOne: {
                filter: { student: sid, question: qid },
                update: { $set: { marksObtained: Number(val) } },
                upsert: true,
              },
            });
            continue;
          }

          // Otherwise treat as questionId
          const qid = String(key);
          if (!allowedQuestionIds.has(qid)) {
            skipped++;
            continue;
          }
          ops.push({
            updateOne: {
              filter: { student: sid, question: qid },
              update: { $set: { marksObtained: Number(val) } },
              upsert: true,
            },
          });
        }
        continue;
      }

      // flat format
      const { studentId, questionId, qNo, marksObtained } = item;
      if (!studentId || marksObtained == null) {
        skipped++;
        continue;
      }
      if (!allowedStudentIds.has(String(studentId))) {
        skipped++;
        continue;
      }

      let resolvedQid = null;
      if (questionId) {
        resolvedQid = String(questionId);
      } else if (qNo != null) {
        const idx = Number(qNo) - 1;
        resolvedQid = questionIdByIndex[idx] || null;
      }
      if (!resolvedQid || !allowedQuestionIds.has(String(resolvedQid))) {
        skipped++;
        continue;
      }
      ops.push({
        updateOne: {
          filter: { student: studentId, question: resolvedQid },
          update: { $set: { marksObtained: Number(marksObtained) } },
          upsert: true,
        },
      });
    }

    if (ops.length === 0)
      return res.status(400).json({ message: "No valid marks to update" });
    const result = await StudentMark.bulkWrite(ops, { ordered: false });

    res.json({
      message: "Marks updated",
      section: section || null,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
      skipped,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
