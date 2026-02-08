const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Student",
  new mongoose.Schema({
    studentId: String,
    name: String
  })
);
