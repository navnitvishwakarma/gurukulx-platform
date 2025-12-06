const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    subject: { type: String, required: true },
    schedule: { type: Map, of: String }, // e.g., { "Mon": "10:00" }
    code: { type: String, unique: true, sparse: true } // For joining
}, { timestamps: true });

module.exports = mongoose.model('Classroom', classroomSchema);
