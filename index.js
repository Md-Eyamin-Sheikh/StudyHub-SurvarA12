const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error(error);
  }
}
run().catch(console.dir);

// Sample route
app.get('/', (req, res) => {
  res.send('Server is running...hi');
});

// Route to fetch data from MongoDB
app.get('/data', async (req, res) => {
  try {
    const database = client.db("StudyHubA12"); 
    const collection = database.collection("StudyHub"); 
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/data/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const database = client.db("StudyHubA12"); 
        const collection = database.collection("StudyHub"); 
        
        let session;
        
        // Try to find by ObjectId first
        if (ObjectId.isValid(id)) {
            session = await collection.findOne({ _id: new ObjectId(id) });
        }
        
        // If not found, try to find by string ID
        if (!session) {
            session = await collection.findOne({ _id: id });
        }

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        res.json(session);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ message: 'Failed to fetch session details' });
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});