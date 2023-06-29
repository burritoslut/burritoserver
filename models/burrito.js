//burrito.js

const mongoose = require('mongoose');

const burritoSchema = new mongoose.Schema({
  burritoName: String,
  restaurantName: String,
  date: Date,
  tortillaQuality: { type: Number, min: 1, max: 10 },
  meatiness: { type: Number, min: 1, max: 10 },
  cheesiness: { type: Number, min: 1, max: 10 },
  mass: { type: Number, min: 1, max: 10 },
  greasiness: { type: Number, min: 1, max: 10 },
  potatoes: { type: Number, min: 1, max: 10 },
  texture: { type: Number, min: 1, max: 10 },
  salsa: { type: Number, min: 1, max: 10 },
  enjoyment: { type: Number, min: 1, max: 10 },
  price: Number,
  notes: String,
  thumbsUp: { type: Number, default: 0 },
  thumbsDown: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Burrito', burritoSchema);
