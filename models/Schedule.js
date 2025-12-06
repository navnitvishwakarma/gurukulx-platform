const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    class_name: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    time: {
        type: String, // HH:MM
        required: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 200
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Schedule', scheduleSchema);
