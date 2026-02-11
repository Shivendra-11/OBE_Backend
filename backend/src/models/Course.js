const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Course",
  new mongoose.Schema({
    code: String,
    name: String,
    semester: Number,
    academicYear: { type: String, default: null },

    // Per-section teacher assignment. One teacher per section for this course.
    sectionTeachers: [
      {
        section: { type: String, required: true },
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],

    // Legacy single-teacher assignment (kept for backward compatibility)
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Aggregated CO attainment stored on course for quick access
    coAttainment: {
      overallLevel: { type: Number, default: null },
      CT_FINAL: {
        totalY: { type: Number, default: null },
        totalN: { type: Number, default: null },
        percentage: { type: Number, default: null },
        level: { type: Number, default: null },
      },
      ASSIGNMENT_FINAL: {
        totalY: { type: Number, default: null },
        totalN: { type: Number, default: null },
        percentage: { type: Number, default: null },
        level: { type: Number, default: null },
      },
    },
  }),
);
