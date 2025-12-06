const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' }, // info, warning, success, error
    link: { type: String }, // Optional action link
    is_read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 604800 } // 7 days in seconds
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
