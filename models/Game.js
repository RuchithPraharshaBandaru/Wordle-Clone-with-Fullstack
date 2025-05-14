const mongoose = require("mongoose")

const guessSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
  },
  result: [
    {
      letter: String,
      status: {
        type: String,
        enum: ["correct", "present", "absent"],
      },
    },
  ],
})

const gameSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
  },
  guesses: [guessSchema],
  completed: {
    type: Boolean,
    default: false,
  },
  won: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Game", gameSchema)
