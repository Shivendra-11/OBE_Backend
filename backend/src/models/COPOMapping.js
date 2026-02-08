const mongoose = require("mongoose");

module.exports = mongoose.model(
  "COPOMapping",
  new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    CO: Number,
    PO: String,
    level: Number // 1,2,3
  })
);
