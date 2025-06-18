const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3001;

// MongoDB Atlas connection string with provided credentials
const MONGO_URI = 'mongodb+srv://aakash_dab03:aakash0312@qreach.h2okblu.mongodb.net/?retryWrites=true&w=majority&appName=qreach';
const DB_NAME = 'qreach';
const COLLECTION = 'excelData';

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

let db, collection;

// Connect to MongoDB
MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db(DB_NAME);
    collection = db.collection(COLLECTION);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Save data endpoint
app.post('/api/save-excel', async (req, res) => {
  const data = req.body.data;
  // Remove previous data and insert new
  await collection.deleteMany({});
  await collection.insertOne({ data });
  res.json({ success: true });
});

// Get data endpoint
app.get('/api/get-excel', async (req, res) => {
  const doc = await collection.findOne({});
  res.json({ data: doc ? doc.data : null });
});