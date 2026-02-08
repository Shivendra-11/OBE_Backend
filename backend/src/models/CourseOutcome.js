const mongoose = require("mongoose");

module.exports = mongoose.model(
  "CourseOutcome",
  new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    number: Number,
    description: String
  })
);
// 6lK5UWzZ8LKhcaUC
