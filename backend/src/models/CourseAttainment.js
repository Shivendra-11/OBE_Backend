const mongoose = require("mongoose");

module.exports = mongoose.model(
  "CourseAttainment",
  new mongoose.Schema({
    course: mongoose.Schema.Types.ObjectId,
    type: String, // CT_FINAL, ASSIGNMENT_FINAL, OVERALL
    // Section-specific (e.g., "A"). If null, it represents overall across all sections.
    section: { type: String, default: null },
    totalY: Number,
    totalN: Number,
    percentage: Number,
    level: Number
  })
);
