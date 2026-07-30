const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const itemRoutes = require('./routes/itemRoutes');
app.use('/api', itemRoutes);

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('Error: MONGO_URI is missing in .env file!');
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => {
    console.error('MongoDB Connection Error: ', err.message);
  });

app.get('/', (req, res) => {
  res.send('CampusCrate API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});