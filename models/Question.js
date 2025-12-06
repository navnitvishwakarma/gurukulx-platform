const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    question: { type: String, required: true },
    options: [{ type: String }], // For MCQ
    answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Index for MCQ or text for others
    type: { type: String, enum: ['mcq', 'text', 'boolean'], default: 'mcq' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
