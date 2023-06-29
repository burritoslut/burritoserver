const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// Hash the password before saving the user model
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcryptjs.hash(user.password, 10);
  }
  next();
});

// Add isValidPassword method
userSchema.methods.isValidPassword = async function(password) {
  const user = this;
  const compare = await bcryptjs.compare(password, user.password);
  return compare;
}

module.exports = mongoose.model('User', userSchema);
