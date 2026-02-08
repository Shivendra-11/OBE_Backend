const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  code: String, 
  description: String
});

module.exports = mongoose.model("ProgramOutcome", schema);
