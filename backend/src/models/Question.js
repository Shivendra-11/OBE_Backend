const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Question",
  new mongoose.Schema({
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    CO: Number,
    maxMarks: Number
  })
);
