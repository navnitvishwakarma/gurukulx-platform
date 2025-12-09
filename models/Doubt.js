const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  answer: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['pending', 'answered', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  answered_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  answered_at: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});


doubtSchema.index({ user: 1, created_at: -1 });
doubtSchema.index({ subject: 1, status: 1 });
doubtSchema.index({ status: 1, priority: 1, created_at: -1 });

module.exports = mongoose.model('Doubt', doubtSchema);
