const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game_type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  xp_earned: {
    type: Number,
    default: 0,
    min: 0
  },
  progress_earned: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  time_taken: {
    type: Number, // in seconds
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});


gameResultSchema.index({ user: 1, created_at: -1 });
gameResultSchema.index({ game_type: 1, score: -1 });
gameResultSchema.index({ created_at: -1 });

module.exports = mongoose.model('GameResult', gameResultSchema);
