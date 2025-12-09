const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['feedback', 'bug_report', 'feature_request', 'general'],
    default: 'feedback'
  },
  status: {
    type: String,
    enum: ['new', 'in_review', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  response: {
    message: {
      type: String,
      trim: true
    },
    responded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responded_at: {
      type: Date
    }
  }
}, {
  timestamps: true
});


feedbackSchema.index({ status: 1, created_at: -1 });
feedbackSchema.index({ type: 1, priority: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
