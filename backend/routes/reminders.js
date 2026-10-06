const express = require('express');
const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id }).sort({ time: 1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user._id };
    if (req.body.id && !req.body.customId) {
      data.customId = req.body.id;
    }
    const reminder = await Reminder.create(data);
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const filter = isObjectId
      ? { $or: [{ _id: req.params.id }, { customId: req.params.id }], userId: req.user._id }
      : { customId: req.params.id, userId: req.user._id };

    const reminder = await Reminder.findOneAndUpdate(
      filter,
      req.body,
      { new: true }
    );
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const filter = isObjectId
      ? { $or: [{ _id: req.params.id }, { customId: req.params.id }], userId: req.user._id }
      : { customId: req.params.id, userId: req.user._id };

    const reminder = await Reminder.findOneAndDelete(filter);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ message: 'Reminder removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
