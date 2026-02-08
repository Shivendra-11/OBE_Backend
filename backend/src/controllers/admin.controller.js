const ProgramOutcome = require("../models/ProgramOutcome");
const Course = require("../models/Course");
const CourseOutcome = require("../models/CourseOutcome");
const COPOMapping = require("../models/COPOMapping");
const User = require("../models/User");

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

exports.createCourse = async (req, res) => {
  try {
    const { code, name, semester } = req.body;
    if (!code || !name) return res.status(400).json({ message: "code and name required" });
    const course = await Course.create({ code, name, semester });
    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createCO = async (req, res) => {
  try {
    let { courseId, courseCode, number, description } = req.body;
    if ((!courseId && !courseCode) || number == null) return res.status(400).json({ message: "courseId/courseCode and CO number required" });
    if (!courseId && courseCode) {
      const c = await Course.findOne({ code: courseCode });
      if (!c) return res.status(404).json({ message: "Course not found for provided courseCode" });
      courseId = c._id;
    }
    const co = await CourseOutcome.create({ course: courseId, number, description });
    res.status(201).json(co);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.mapCOPo = async (req, res) => {
  try {
    // Accept either courseId (ObjectId) or courseCode for convenience
    let { courseId, courseCode, CO, PO, level } = req.body;
    if ((!courseId && !courseCode) || CO == null || !PO) return res.status(400).json({ message: "courseId/courseCode, CO and PO required" });

    // resolve courseId if courseCode provided
    if (!courseId && courseCode) {
      const course = await Course.findOne({ code: courseCode });
      if (!course) return res.status(404).json({ message: "Course not found for provided courseCode" });
      courseId = course._id;
    }

    // validate courseId is a real course
    const courseExists = await Course.findById(courseId);
    if (!courseExists) return res.status(404).json({ message: "Course not found" });

    const mapping = await COPOMapping.create({ course: courseId, CO, PO, level });
    res.status(201).json(mapping);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignTeacherToCourse = async (req, res) => {
  try {
    let { courseId, courseCode, teacherId } = req.body;
    if ((!courseId && !courseCode) || !teacherId) return res.status(400).json({ message: "courseId/courseCode and teacherId required" });
    if (!courseId && courseCode) {
      const c = await Course.findOne({ code: courseCode });
      if (!c) return res.status(404).json({ message: "Course not found for provided courseCode" });
      courseId = c._id;
    }
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher") return res.status(400).json({ message: "Invalid teacher" });
    const course = await Course.findByIdAndUpdate(courseId, { assignedTeacher: teacherId }, { new: true });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.find().select('code name semester assignedTeacher');
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listMappings = async (req, res) => {
  try {
    const mappings = await COPOMapping.find().populate('course', 'code name').lean();
    res.json(mappings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
