const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicationId: { type: String },
  customId: { type: String, index: true },
  title: { type: String, required: true },
  time: { type: String, required: true },
  days: [{ type: Number }],
  enabled: { type: Boolean, default: true },
  dosage: String,
  instructions: String,
  lastTaken: String,
  snoozedUntil: String,
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
