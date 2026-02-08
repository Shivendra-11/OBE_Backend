const mongoose = require("mongoose");

module.exports = mongoose.model(
  "COAttainment",
  new mongoose.Schema({
    course: mongoose.Schema.Types.ObjectId,
    examType: String,
    CO: Number,
    Y: Number,
    N: Number,
    percentage: Number,
    level: Number
  })
);
