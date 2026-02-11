const ProgramOutcome = require("../models/ProgramOutcome");
const Course = require("../models/Course");
const CourseOutcome = require("../models/CourseOutcome");
const COPOMapping = require("../models/COPOMapping");
const User = require("../models/User");
const Exam = require("../models/Exam");
const COAttainment = require("../models/COAttainment");
const CourseAttainment = require("../models/CourseAttainment");
const attainmentService = require("../services/attainment.service");

const normalizeSection = (s) => (s == null ? null : String(s).trim() || null);

const getLevel = (p) => (p >= 70 ? 3 : p >= 60 ? 2 : p >= 50 ? 1 : 0);

exports.createPO = async (req, res) => {
  try {
    const { code, description } = req.body;
    if (!code) return res.status(400).json({ message: "code required" });
    const po = await ProgramOutcome.create({ code, description });
    res.status(201).json(po);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createPOBulk = async (req, res) => {
  try {
    const { pos } = req.body;
    if (!Array.isArray(pos) || pos.length === 0) {
      return res.status(400).json({ message: "pos array required" });
    }

    const docs = pos
      .filter((p) => p && p.code)
      .map((p) => ({
        code: String(p.code),
        description: p.description == null ? undefined : String(p.description),
      }));

    if (docs.length === 0)
      return res.status(400).json({ message: "No valid PO entries" });

    const created = await ProgramOutcome.insertMany(docs, { ordered: false });
    res.status(201).json({ count: created.length, data: created });
  } catch (err) {
    // insertMany with ordered:false may throw but still insert some docs
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { code, name, semester, academicYear } = req.body;
    if (!code || !name || semester == null || !academicYear) {
      return res
        .status(400)
        .json({ message: "code, name, semester and academicYear required" });
    }

    const course = await Course.create({
      code,
      name,
      semester,
      academicYear,
      sectionTeachers: [],
    });

    // Auto-add this course to all students of the same semester & academic year
    await User.updateMany(
      {
        role: "student",
        semester: Number(semester),
        academicYear: String(academicYear),
      },
      { $addToSet: { courses: course._id } },
    );

    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createCO = async (req, res) => {
  try {
    let { courseId, courseCode, number, description } = req.body;
    if ((!courseId && !courseCode) || number == null)
      return res
        .status(400)
        .json({ message: "courseId/courseCode and CO number required" });
    if (!courseId && courseCode) {
      const c = await Course.findOne({ code: courseCode });
      if (!c)
        return res
          .status(404)
          .json({ message: "Course not found for provided courseCode" });
      courseId = c._id;
    }
    const co = await CourseOutcome.create({
      course: courseId,
      number,
      description,
    });
    res.status(201).json(co);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createCOBulk = async (req, res) => {
  try {
    let { courseId, courseCode, cos } = req.body;
    if ((!courseId && !courseCode) || !Array.isArray(cos) || cos.length === 0) {
      return res
        .status(400)
        .json({ message: "courseId/courseCode and cos array required" });
    }

    if (!courseId && courseCode) {
      const c = await Course.findOne({ code: courseCode });
      if (!c)
        return res
          .status(404)
          .json({ message: "Course not found for provided courseCode" });
      courseId = c._id;
    }

    const docs = cos
      .filter((c) => c && c.number != null)
      .map((c) => ({
        course: courseId,
        number: Number(c.number),
        description: c.description == null ? undefined : String(c.description),
      }));

    if (docs.length === 0)
      return res.status(400).json({ message: "No valid CO entries" });

    const created = await CourseOutcome.insertMany(docs, { ordered: false });
    res.status(201).json({ count: created.length, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.mapCOPo = async (req, res) => {
  try {
    // Accept either courseId (ObjectId) or courseCode for convenience
    let { courseId, courseCode, CO, PO, level } = req.body;
    if ((!courseId && !courseCode) || CO == null || !PO)
      return res
        .status(400)
        .json({ message: "courseId/courseCode, CO and PO required" });

    // resolve courseId if courseCode provided
    if (!courseId && courseCode) {
      const course = await Course.findOne({ code: courseCode });
      if (!course)
        return res
          .status(404)
          .json({ message: "Course not found for provided courseCode" });
      courseId = course._id;
    }

    // validate courseId is a real course
    const courseExists = await Course.findById(courseId);
    if (!courseExists)
      return res.status(404).json({ message: "Course not found" });

    const mapping = await COPOMapping.create({
      course: courseId,
      CO,
      PO,
      level,
    });
    res.status(201).json(mapping);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.mapCOPoBulk = async (req, res) => {
  try {
    let { courseId, courseCode, mappings } = req.body;
    if (
      (!courseId && !courseCode) ||
      !Array.isArray(mappings) ||
      mappings.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "courseId/courseCode and mappings array required" });
    }

    if (!courseId && courseCode) {
      const course = await Course.findOne({ code: courseCode });
      if (!course)
        return res
          .status(404)
          .json({ message: "Course not found for provided courseCode" });
      courseId = course._id;
    }

    const courseExists = await Course.findById(courseId).select("_id");
    if (!courseExists)
      return res.status(404).json({ message: "Course not found" });

    const docs = mappings
      .filter((m) => m && m.CO != null && m.PO)
      .map((m) => ({
        course: courseId,
        CO: Number(m.CO),
        PO: String(m.PO),
        level: m.level == null ? undefined : Number(m.level),
      }));

    if (docs.length === 0)
      return res.status(400).json({ message: "No valid mappings" });

    const created = await COPOMapping.insertMany(docs, { ordered: false });
    res.status(201).json({ count: created.length, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.assignTeacherToCourse = async (req, res) => {
  try {
    let { courseId, courseCode, teacherId, section } = req.body;
    if ((!courseId && !courseCode) || !teacherId || !section) {
      return res.status(400).json({
        message: "courseId/courseCode, teacherId and section required",
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
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher")
      return res.status(400).json({ message: "Invalid teacher" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const normalizedSection = String(section).trim();
    if (!normalizedSection)
      return res.status(400).json({ message: "section required" });

    course.sectionTeachers = Array.isArray(course.sectionTeachers)
      ? course.sectionTeachers
      : [];
    const idx = course.sectionTeachers.findIndex(
      (st) =>
        String(st.section).toLowerCase() === normalizedSection.toLowerCase(),
    );
    if (idx >= 0) {
      course.sectionTeachers[idx].teacher = teacherId;
    } else {
      course.sectionTeachers.push({
        section: normalizedSection,
        teacher: teacherId,
      });
    }

    // Keep legacy field in sync only if there is exactly one section assignment.
    // (Legacy logic expects a single teacher per course.)
    if (course.sectionTeachers.length === 1) {
      course.assignedTeacher = course.sectionTeachers[0].teacher;
    } else {
      course.assignedTeacher = null;
    }

    await course.save();
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.find().select(
      "code name semester academicYear assignedTeacher sectionTeachers",
    );
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listMappings = async (req, res) => {
  try {
    const mappings = await COPOMapping.find()
      .populate("course", "code name")
      .lean();
    res.json(mappings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getExamCOAttainment = async (req, res) => {
  try {
    const { examId } = req.params;
    const section = normalizeSection(req.query.section);
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const records = await COAttainment.find({
      exam: exam._id,
      section: section,
    })
      .sort({ CO: 1 })
      .lean();

    res.json({
      examId: exam._id,
      courseId: exam.course,
      section: section,
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
    const rawSection = req.query.section;
    const section = normalizeSection(rawSection);
    const type = req.query.type ? String(req.query.type) : null;

    // If section=all, return per-section records AND combined aggregates
    if (rawSection && String(rawSection).toLowerCase() === "all") {
      // If type provided, limit to that type for CourseAttainment
      const caFilter = { course: courseId };
      if (type) caFilter.type = type;
      const records = await CourseAttainment.find(caFilter).lean();

      // Combined aggregation for course-level types (CT_FINAL / ASSIGNMENT_FINAL)
      const combined = {};
      if (!type || type === "CT_FINAL" || type === "ASSIGNMENT_FINAL") {
        const targetTypes = type ? [type] : ["CT_FINAL", "ASSIGNMENT_FINAL"];
        for (const t of targetTypes) {
          const docs = records.filter((r) => r.type === t);
          let totalY = 0,
            totalN = 0;
          docs.forEach((d) => {
            totalY += Number(d.totalY || 0);
            totalN += Number(d.totalN || 0);
          });
          const percentage = (totalY / (totalY + totalN)) * 100 || 0;
          combined[t] = {
            totalY,
            totalN,
            percentage,
            level: getLevel(percentage),
          };
        }
      }

      // If type absent or CO-specific requested, also aggregate CO attainment across sections
      let combinedCO = null;
      if (!type || type === "CO") {
        const coDocs = await COAttainment.find({ course: courseId }).lean();
        const map = {};
        coDocs.forEach((d) => {
          const key = String(d.CO);
          if (!map[key]) map[key] = { Y: 0, N: 0 };
          map[key].Y += Number(d.Y || 0);
          map[key].N += Number(d.N || 0);
        });
        combinedCO = Object.keys(map)
          .map((k) => {
            const o = map[k];
            const pct = (o.Y / (o.Y + o.N)) * 100 || 0;
            return {
              CO: Number(k),
              totalY: o.Y,
              totalN: o.N,
              percentage: pct,
              level: getLevel(pct),
            };
          })
          .sort((a, b) => a.CO - b.CO);
      }

      return res.json({
        courseId,
        section: "all",
        perSection: records,
        combined,
        combinedCO,
      });

      // Also compute & persist final overall level as average of combined CT and ASSIGNMENT levels
      try {
        const ctLevel = combined.CT_FINAL
          ? Number(combined.CT_FINAL.level || 0)
          : 0;
        const assLevel = combined.ASSIGNMENT_FINAL
          ? Number(combined.ASSIGNMENT_FINAL.level || 0)
          : 0;
        const finalLevel = Math.round((ctLevel + assLevel) / 2 || 0);

        // Upsert an OVERALL CourseAttainment document representing across-all-sections
        await CourseAttainment.findOneAndUpdate(
          { course: courseId, type: "OVERALL", section: null },
          {
            course: courseId,
            type: "OVERALL",
            section: null,
            totalY: null,
            totalN: null,
            percentage: null,
            level: finalLevel,
          },
          { upsert: true, new: true },
        );
      } catch (e) {
        console.error("Failed to persist OVERALL attainment:", e);
      }
    }

    // default: single-section (or null) filtering
    const filter = { course: courseId, section: section };
    if (type) filter.type = type;

    const records = await CourseAttainment.find(filter).lean();
    res.json({ courseId, section, data: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin API: compute combined CT and ASSIGNMENT levels and store overall CO attainment on Course
exports.computeCourseOverall = async (req, res) => {
  try {
    let { courseId } = req.params;
    if (courseId && !/^[0-9a-fA-F]{24}$/.test(courseId)) {
      const c = await Course.findOne({ code: courseId });
      if (!c) return res.status(404).json({ message: "Course not found" });
      courseId = c._id;
    }

    // Delegate to service which aggregates CT_FINAL and ASSIGNMENT_FINAL across sections
    const result = await attainmentService.calculateOverallCombined(courseId);

    // return the persisted coAttainment from Course for convenience
    const course = await Course.findById(courseId)
      .select("coAttainment")
      .lean();
    return res.json({
      courseId,
      result,
      coAttainment: course ? course.coAttainment : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
