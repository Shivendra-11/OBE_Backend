const StudentMark = require("../models/StudentMark");
const COAttainment = require("../models/COAttainment");
const CourseAttainment = require("../models/CourseAttainment");

exports.getMyMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const marks = await StudentMark.find({ student: userId }).populate({ path: 'question', populate: { path: 'exam', select: 'name course type' } });
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyAttainment = async (req, res) => {
  try {
    // Without enrollment model, return course-level attainment records.
    const co = await COAttainment.find({});
    const ca = await CourseAttainment.find({});
    res.json({ coAttainment: co, courseAttainment: ca });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
