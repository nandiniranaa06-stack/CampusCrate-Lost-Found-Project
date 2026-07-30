const express = require('express');
const router = express.Router();
const Item = require('../models/Item');


router.get('/items', async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let query = {};

    if (type) query.type = type; 
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(query).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/items', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.patch('/items/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;