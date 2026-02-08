const mongoose = require("mongoose");

module.exports = mongoose.model(
  "StudentMark",
  new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    marksObtained: Number
  }, { timestamps: true })
);
