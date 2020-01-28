const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  _id: { type: String },
  email: {
    type: String,
    required: true
  },
  scripts: [
    {
      scriptId: {
        type: Schema.Types.ObjectId,
        ref: "Script",
        required: false
      }
    }
  ]
});

module.exports = mongoose.model("User", userSchema);
