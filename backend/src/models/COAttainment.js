const mongoose = require("mongoose");

module.exports = mongoose.model(
  "COAttainment",
  new mongoose.Schema({
    course: mongoose.Schema.Types.ObjectId,
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", default: null },
    examType: String,
    // Section-specific attainment (e.g., "A"). If null, it represents overall across all sections.
    section: { type: String, default: null },
    CO: Number,
    Y: Number,
    N: Number,
    percentage: Number,
    level: Number
  })
);
