const m = require('mongoose'); const { Schema } = m;
const STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const CATEGORIES = ['Road Infrastructure', 'Waste Management', 'Street Lighting', 'Water & Drainage', 'Public Safety', 'Parks & Environment', 'Public Infrastructure', 'Other'];
const User = m.model('User', new Schema({ name: String, email: { type: String, unique: true }, passwordHash: String, role: { type: String, enum: ['admin', 'citizen'], default: 'citizen' } }, { timestamps: { createdAt: true, updatedAt: false } }));
const Issue = m.model('Issue', new Schema({
  issueId: { type: String, unique: true }, reporterId: { type: String, index: true }, imageUrl: String,
  latitude: Number, longitude: Number, locationText: String, citizenDescription: String,
  issueType: String, category: { type: String, enum: CATEGORIES }, severity: { type: String, enum: SEVERITIES },
  suggestedDepartment: String, explanation: String, recommendedAction: String, confidence: { type: Number, default: null },
  analysisMode: { type: String, enum: ['ai', 'demo'], default: 'demo' },
  status: { type: String, enum: STATUSES, default: 'Submitted' }, masterIssueId: String,
  supportCount: { type: Number, default: 1 }, supporters: [String], isDemoData: { type: Boolean, default: false }
}, { timestamps: true }));
const StatusHistory = m.model('StatusHistory', new Schema({ issue: { type: Schema.Types.ObjectId, ref: 'Issue', index: true }, previousStatus: String, newStatus: String, changedBy: String, note: String, timestamp: { type: Date, default: Date.now } }));
const DuplicateRecord = m.model('DuplicateRecord', new Schema({ issue: { type: Schema.Types.ObjectId, ref: 'Issue', index: true }, related: { type: Schema.Types.ObjectId, ref: 'Issue' }, distance: Number, similarityReason: String, reviewed: { type: Boolean, default: false }, confirmed: { type: Boolean, default: false } }));
const Counter = m.model('Counter', new Schema({ _id: String, seq: { type: Number, default: 0 } }));
module.exports = { User, Issue, StatusHistory, DuplicateRecord, Counter, STATUSES, SEVERITIES, CATEGORIES };
