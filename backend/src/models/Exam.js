const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Exam",
  new mongoose.Schema({
    name: String,
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    type: { type: String, enum: ["PRE_CT","CT1","CT2","CT3","PUE","ASSIGNMENT","OTHER"], default: "OTHER" }
  })
);
