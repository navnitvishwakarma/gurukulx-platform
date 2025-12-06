const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'video', 'link', 'image'], required: true },
    url: { type: String, required: true },
    description: { type: String },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }] // Optional: link to specific classes
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
