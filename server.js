//server.js

require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const User = require('./models/user');
const Burrito = require('./models/burrito');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000; // use environment variable or fallback to a default value
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret'; // use environment variable or fallback to a default value

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Failed to connect to MongoDB', error));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get('/burritos', async (req, res) => {
  try {
    const burritos = await Burrito.find();
    res.json(burritos);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/search', async (req, res) => {
  const { searchTerm = '' } = req.query;  // <-- Providing default value for searchTerm here

  console.log('searchTerm:', searchTerm);  // <-- Debugging searchTerm here
  console.log('RegExp:', new RegExp(searchTerm, 'i'));  // <-- Debugging RegExp here

  try {
    const results = await Burrito.find({ restaurantName: new RegExp(searchTerm, 'i') });
    res.json(results);
  } catch (error) {
    console.error(error);  // <-- This will log error details to your server console
    res.status(500).send(error);
  }
});

// ...

app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    const result = await user.save();
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ...

app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ success: false, message: 'User not found' });
  }

  // Check if password is correct
  const isPasswordValid = await user.isValidPassword(password);

  if (!isPasswordValid) {
    return res.status(400).json({ success: false, message: 'Incorrect password' });
  }

  // Password is correct, generate JWT
  const token = jwt.sign({ _id: user._id }, jwtSecret, { expiresIn: '24h' });

  // Send JWT to client
  return res.json({ success: true, token });
});

app.patch('/users/me', authenticateToken, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send();
    }

    updates.forEach((update) => user[update] = req.body[update]);
    await user.save();

    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.patch('/users/me/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send();
    }
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid current password');
    }
    user.password = await bcryptjs.hash(newPassword, 10);
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send();
    }
    await Burrito.deleteMany({ userId: req.user._id });
    await user.remove();
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ...


app.post('/burritos', authenticateToken, async (req, res) => {
  try {
    const newBurrito = new Burrito({ ...req.body, userId: req.user._id });
    const result = await newBurrito.save();
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.put('/burritos/:id', authenticateToken, async (req, res) => {
  try {
    const burrito = await Burrito.findById(req.params.id);
    if (!burrito) {
      return res.status(404).send();
    }
    if (burrito.userId.toString() !== req.user._id) {
      return res.status(403).send('You do not have permission to update this burrito review');
    }
    const updatedBurrito = await Burrito.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBurrito);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/burritos/:id', authenticateToken, async (req, res) => {
  try {
    const burrito = await Burrito.findById(req.params.id);
    if (!burrito) {
      return res.status(404).send();
    }
    if (burrito.userId.toString() !== req.user._id) {
      return res.status(403).send('You do not have permission to update this burrito review');
    }
    const updatedBurrito = await Burrito.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBurrito);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/burritos/:id', authenticateToken, async (req, res) => {
  try {
    const burrito = await Burrito.findById(req.params.id);
    if (!burrito) {
      return res.status(404).send();
    }
    if (burrito.userId.toString() !== req.user._id) {
      return res.status(403).send('You do not have permission to delete this burrito review');
    }
    await burrito.remove();
    res.send(burrito);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ...

app.patch('/burritos/:id/like', authenticateToken, async (req, res) => {
  try {
    const burrito = await Burrito.findById(req.params.id);
    if (!burrito) {
      return res.status(404).send();
    }
    burrito.thumbsUp += 1;
    await burrito.save();
    res.send(burrito);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/burritos/:id/dislike', authenticateToken, async (req, res) => {
  try {
    const burrito = await Burrito.findById(req.params.id);
    if (!burrito) {
      return res.status(404).send();
    }
    burrito.thumbsDown += 1;
    await burrito.save();
    res.send(burrito);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ...

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
  });
} else {
  module.exports = app;
}

