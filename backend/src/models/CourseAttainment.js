const mongoose = require("mongoose");

module.exports = mongoose.model(
  "CourseAttainment",
  new mongoose.Schema({
    course: mongoose.Schema.Types.ObjectId,
    type: String, // CT_FINAL, ASSIGNMENT_FINAL, OVERALL
    totalY: Number,
    totalN: Number,
    percentage: Number,
    level: Number
  })
);
