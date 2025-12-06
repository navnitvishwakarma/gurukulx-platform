const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  game: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  due_date: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submitted_at: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
assignmentSchema.index({ teacher: 1, created_at: -1 });
assignmentSchema.index({ class_name: 1, status: 1 });
assignmentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // Auto-delete after 7 days

module.exports = mongoose.model('Assignment', assignmentSchema);
