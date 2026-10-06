const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  phone: { type: String },
  password: { type: String, required: true },
  dateOfBirth: String,
  preferredLanguage: { type: String, default: 'en' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  conditions: [{ type: String, trim: true }],
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  settings: {
    notifications: { type: Boolean, default: true },
    voiceEnabled: { type: Boolean, default: true },
    largeText: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
    reminderSound: { type: String, default: 'default' },
    reminderAdvanceMinutes: { type: Number, default: 15 },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
