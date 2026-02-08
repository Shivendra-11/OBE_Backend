const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Course",
  new mongoose.Schema({
    code: String,
    name: String,
    semester: Number,
    assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  })
);
