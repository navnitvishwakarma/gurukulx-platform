const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    user_agent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
