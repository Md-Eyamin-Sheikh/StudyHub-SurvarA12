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

// API endpoint to get booked sessions with details
app.get('/api/student/booked-sessions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const database = client.db("StudyHubA12");
    const bookedSessionCollection = database.collection("bookedSession");
    const studySessionCollection = database.collection("StudyHub");
    
    const bookedSessions = await bookedSessionCollection.find({ studentEmail: email }).toArray();
    
    // Get full session details for each booked session
    const sessionsWithDetails = await Promise.all(
      bookedSessions.map(async (booking) => {
        const sessionDetails = await studySessionCollection.findOne({ _id: booking.studySessionId });
        return { ...booking, sessionDetails };
      })
    );
    
    res.json({ success: true, bookedSessions: sessionsWithDetails });
  } catch (error) {
    console.error('Error fetching booked sessions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoints for reviews
app.post('/api/reviews', async (req, res) => {
  try {
    const { studentEmail, studySessionId, rating, comment } = req.body;
    const database = client.db("StudyHubA12");
    const reviewsCollection = database.collection("reviews");
    
    const reviewData = {
      studentEmail,
      studySessionId,
      rating,
      comment,
      createdAt: new Date()
    };
    
    const result = await reviewsCollection.insertOne(reviewData);
    res.json({ success: true, reviewId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/reviews/:sessionId', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const reviewsCollection = database.collection("reviews");
    const reviews = await reviewsCollection.find({ studySessionId: req.params.sessionId }).toArray();
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoints for notes
app.post('/api/notes', async (req, res) => {
  try {
    const { email, title, description } = req.body;
    const database = client.db("StudyHubA12");
    const notesCollection = database.collection("notes");
    
    const noteData = { email, title, description, createdAt: new Date() };
    const result = await notesCollection.insertOne(noteData);
    res.json({ success: true, noteId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/notes/:email', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const notesCollection = database.collection("notes");
    const notes = await notesCollection.find({ email: req.params.email }).toArray();
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { title, description } = req.body;
    const database = client.db("StudyHubA12");
    const notesCollection = database.collection("notes");
    
    const result = await notesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, description, updatedAt: new Date() } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const notesCollection = database.collection("notes");
    await notesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoint for study materials
app.get('/api/materials/:sessionId', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const materialsCollection = database.collection("studyMaterials");
    const materials = await materialsCollection.find({ studySessionId: req.params.sessionId }).toArray();
    res.json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoint to check if already booked a session
app.get('/api/booked-sessions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const database = client.db("StudyHubA12");
    const bookedSessionCollection = database.collection("bookedSession");
    
    const bookedSessions = await bookedSessionCollection.find({ studentEmail: email }).toArray();
    const sessionIds = bookedSessions.map(booking => booking.studySessionId);
    
    res.json({ success: true, bookedSessions: sessionIds });
  } catch (error) {
    console.error('Error fetching booked sessions:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching booked sessions' });
  }
});

// API endpoint to book a session
app.post('/api/book-session', async (req, res) => {
  try {
    const { studentEmail, studySessionId, tutorEmail, sessionTitle, registrationFee } = req.body;
    
    const database = client.db("StudyHubA12");
    const bookedSessionCollection = database.collection("bookedSession");
    
    // Check if already booked
    const existingBooking = await bookedSessionCollection.findOne({
      studentEmail,
      studySessionId
    });
    
    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'Session already booked' });
    }
    
    const bookingData = {
      studentEmail,
      studySessionId,
      tutorEmail,
      sessionTitle,
      registrationFee: registrationFee || 0,
      bookedAt: new Date()
    };
    
    const result = await bookedSessionCollection.insertOne(bookingData);
    
    if (result.insertedId) {
      res.status(201).json({ 
        success: true, 
        message: 'Session booked successfully',
        bookingId: result.insertedId 
      });
    } else {
      res.status(400).json({ success: false, message: 'Failed to book session' });
    }
  } catch (error) {
    console.error('Error booking session:', error);
    res.status(500).json({ success: false, message: 'Server error while booking session' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});