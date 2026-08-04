const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/campuscrate";

mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connected Successfully"))
.catch((err) => console.error("MongoDB Connection Error:", err));

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, default: 'student' },
  blocked: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, default: 'active' },
  photoUrl: { type: String },
  claimQuestion: { type: String },
  reported: { type: Boolean, default: false },
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

const claimSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  userEmail: { type: String, required: true },
  proofText: { type: String, required: true },
  status: { type: String, default: 'Pending' },
}, { timestamps: true });

const Claim = mongoose.model('Claim', claimSchema);

const messageSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

io.on('connection', (socket) => {
  console.log('A user connected via socket:', socket.id);

  socket.on('join_room', (itemId) => {
    socket.join(itemId);
  });

  socket.on('send_message', (data) => {
    io.to(data.itemId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/items', async (req, res) => {
  try {
    const { category, search, type } = req.query;
    let query = {};
    if (category && category !== "All") query.category = category;
    if (type && type !== "all") query.type = type;
    if (search) query.title = { $regex: search, $options: 'i' };

    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

app.post('/items', async (req, res) => {
  try {
    const newItem = new Item({
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      date: req.body.date,
      photoUrl: req.body.photoUrl || '',
      claimQuestion: req.body.claimQuestion || ''
    });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to add item" });
  }
});

app.patch('/items/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.patch('/items/:id/report', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { reported: true },
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to report item" });
  }
});

app.delete('/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    await Claim.deleteMany({ itemId: req.params.id });
    await Message.deleteMany({ itemId: req.params.id });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.post('/claims', async (req, res) => {
  try {
    const { itemId, userEmail, proofText } = req.body;
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const newClaim = new Claim({
      itemId,
      userEmail,
      proofText,
      status: 'Pending'
    });
    await newClaim.save();
    res.status(201).json({ message: "Claim submitted successfully and pending review!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit claim" });
  }
});

app.get('/admin/claims', async (req, res) => {
  try {
    const claims = await Claim.find().populate('itemId');
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

app.patch('/admin/claims/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedClaim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updatedClaim);
  } catch (err) {
    res.status(500).json({ error: "Failed to update claim status" });
  }
});

app.get('/admin/reports', async (req, res) => {
  try {
    const reportedItems = await Item.find({ reported: true });
    res.json(reportedItems);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reported items" });
  }
});

app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.patch('/admin/users/:id/block', async (req, res) => {
  try {
    const { blocked } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { blocked },
      { new: true }
    ).select('-password');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user block status" });
  }
});

app.get('/messages/:itemId', async (req, res) => {
  try {
    const messages = await Message.find({ itemId: req.params.itemId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post('/messages', async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (user.blocked) {
      return res.status(403).json({ error: "Account is blocked by admin" });
    }
    res.json({ message: "Logged in successfully", user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.post('/auth/google', async (req, res) => {
  try {
    const { name, email } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, password: Math.random().toString(36) });
      await user.save();
    }
    if (user.blocked) {
      return res.status(403).json({ error: "Account is blocked by admin" });
    }
    res.json({ message: "Google login successful", user });
  } catch (err) {
    res.status(500).json({ error: "Google authentication failed" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});