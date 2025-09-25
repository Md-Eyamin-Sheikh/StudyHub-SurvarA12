const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const Stripe = require('stripe');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Cookie options for secure authentication
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};


app.use(cors());


// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://resilient-vacherin-ecfaf3.netlify.app"
    ],
    credentials: true,
  })
);
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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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

// User registration API
app.post('/users', async (req, res) => {
  try {
    const { uid, name, email, photoURL, role } = req.body;
    const database = client.db("StudyHubA12");
    const collection = database.collection("users");
    
    // Check if user already exists
    const existingUser = await collection.findOne({ uid });
    if (existingUser) {
      return res.status(200).json({ message: 'User already exists', user: existingUser });
    }
    
    const userData = {
      uid,
      displayName: name,
      email,
      photoURL,
      role: role || 'student',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(userData);
    res.status(201).json({ message: 'User created successfully', userId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// JWT Login API
app.post('/auth/login', async (req, res) => {
  try {
    const { uid, email } = req.body;
    const database = client.db("StudyHubA12");
    const collection = database.collection("users");
    
    const user = await collection.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const token = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        uid: user.uid, 
        email: user.email, 
        displayName: user.displayName, 
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create token
app.post("/jwt", async (req, res) => {
  const user = req.body;
  console.log("user for token", user);
  const token = jwt.sign(user, process.env.JWT_SECRET);
  res.cookie("token", token, cookieOptions).send({ success: true });
});

// Clearing token
app.post("/logout", async (req, res) => {
  const user = req.body;
  console.log("logging out", user);
  res
    .clearCookie("token", { ...cookieOptions, maxAge: 0 })
    .send({ success: true });
});

// Get user data by UID
app.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const database = client.db("StudyHubA12");
    const collection = database.collection("users");
    
    const user = await collection.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      uid: user.uid, 
      email: user.email, 
      displayName: user.displayName, 
      role: user.role,
      photoURL: user.photoURL 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user role by UID
app.get('/users/:uid/role', async (req, res) => {
  try {
    const { uid } = req.params;
    const database = client.db("StudyHubA12");
    const collection = database.collection("users");
    
    const user = await collection.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes

// Get all users
app.get('/admin/users', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("users");
    const users = await collection.find({}).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users by name or email
app.get('/admin/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    const database = client.db("StudyHubA12");
    const collection = database.collection("users");
    
    const users = await collection.find({
      $or: [
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).toArray();
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
app.patch('/admin/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    const database = client.db("StudyHubA12");
    const collection = database.collection("users");
    
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all sessions for admin
app.get('/admin/sessions', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("StudyHub");
    const sessions = await collection.find({}).toArray();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve session
app.patch('/admin/sessions/:sessionId/approve', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { isPaid, registrationFee } = req.body;
    
    const database = client.db("StudyHubA12");
    const collection = database.collection("StudyHub");
    
    const result = await collection.updateOne(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          status: 'approved',
          isPaid,
          registrationFee,
          approvedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json({ message: 'Session approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject session
app.patch('/admin/sessions/:sessionId/reject', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason, response } = req.body;
    
    const database = client.db("StudyHubA12");
    const collection = database.collection("StudyHub");
    
    const result = await collection.updateOne(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          status: 'rejected',
          rejectionReason: reason,
          rejectionResponse: response,
          rejectedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json({ message: 'Session rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete session
app.delete('/admin/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const database = client.db("StudyHubA12");
    const collection = database.collection("StudyHub");
    
    const result = await collection.deleteOne({ _id: new ObjectId(sessionId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all materials
app.get('/admin/materials', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("materials");
    const materials = await collection.find({}).toArray();
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete material
app.delete('/admin/materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    
    const database = client.db("StudyHubA12");
    const collection = database.collection("materials");
    
    const result = await collection.deleteOne({ _id: new ObjectId(materialId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    res.json({ message: 'Material deleted successfully' });
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

// Stripe payment intent endpoint
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, 
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

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

// Tutor Dashboard API endpoints

// Create study session
app.post('/api/tutor/sessions', async (req, res) => {
  try {
    const sessionData = {
      ...req.body,
      registrationFee: 0,
      status: 'pending',
      createdAt: new Date()
    };
    
    const database = client.db("StudyHubA12");
    const collection = database.collection("StudyHub");
    const result = await collection.insertOne(sessionData);
    
    res.json({ success: true, sessionId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get tutor's sessions
app.get('/api/tutor/sessions/:email', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("StudyHub");
    const sessions = await collection.find({ tutorEmail: req.params.email }).toArray();
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Resubmit rejected session
app.put('/api/tutor/sessions/:id/resubmit', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("StudyHub");
    
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'pending', resubmittedAt: new Date() } }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload materials
app.post('/api/tutor/materials', async (req, res) => {
  try {
    const materialData = {
      ...req.body,
      uploadedAt: new Date()
    };
    
    const database = client.db("StudyHubA12");
    const collection = database.collection("studyMaterials");
    const result = await collection.insertOne(materialData);
    
    res.json({ success: true, materialId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all materials from all tutors (for admin)
app.get('/api/tutor/materials/all', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("studyMaterials");
    const materials = await collection.find({}).toArray();
    res.json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get tutor's materials
app.get('/api/tutor/materials/:email', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("studyMaterials");
    const materials = await collection.find({ tutorEmail: req.params.email }).toArray();
    res.json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update material
app.put('/api/tutor/materials/:id', async (req, res) => {
  try {
    const { title, imageUrl, driveLink } = req.body;
    const database = client.db("StudyHubA12");
    const collection = database.collection("studyMaterials");
    
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, imageUrl, driveLink, updatedAt: new Date() } }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete material
app.delete('/api/tutor/materials/:id', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("studyMaterials");
    await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get approved sessions for material upload
app.get('/api/tutor/approved-sessions/:email', async (req, res) => {
  try {
    const database = client.db("StudyHubA12");
    const collection = database.collection("StudyHub");
    const sessions = await collection.find({ 
      tutorEmail: req.params.email, 
      status: 'approved' 
    }).toArray();
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});