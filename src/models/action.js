const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const actionSchema = new Schema({
  _id: { type: String },
  action: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Action", actionSchema);
