const mongoose = require("mongoose");

module.exports = mongoose.model(
  "ActualCOPOMapping",
  new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    CO: Number,
    PO: String,
    level: Number, // computed level (can be fractional)
  }),
);
