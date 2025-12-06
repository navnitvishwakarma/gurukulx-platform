const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    recipients: {
        type: String,
        required: true, // 'all' or specific class name
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
