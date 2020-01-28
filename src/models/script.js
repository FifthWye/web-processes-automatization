const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const scriptSchema = new Schema({
  _id: { type: String },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  users: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    }
  ],
  actions: [
    {
      actionId: {
        type: Schema.Types.ObjectId,
        ref: "Action",
        required: true
      }
    }
  ]
});

module.exports = mongoose.model("Script", scriptSchema);
