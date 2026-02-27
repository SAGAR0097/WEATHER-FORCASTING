import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

// MongoDB Connection with Fallback
async function connectToDatabase() {
  try {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log("No MONGODB_URI found, starting MongoMemoryServer...");
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    }
    
    await mongoose.connect(uri);
    console.log("Connected to MongoDB:", uri.startsWith('mongodb://127.0.0.1') ? 'Memory Server' : 'External');
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

connectToDatabase();

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const citySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  isFavorite: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);
const City = mongoose.model('City', citySchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Middleware: Auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, password: hashedPassword });
      await user.save();
      
      // Generate token for immediate login
      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
      res.status(201).json({ token, user: { id: user._id, username: user.username } });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Username already exists or database error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username });
      if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
        res.json({ token, user: { id: user._id, username: user.username } });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error during login" });
    }
  });

  // City Routes
  app.get("/api/cities", authenticateToken, async (req: any, res) => {
    try {
      const cities = await City.find({ userId: req.user.id });
      res.json(cities.map(c => ({
        id: c._id,
        name: c.name,
        lat: c.lat,
        lon: c.lon,
        is_favorite: c.isFavorite ? 1 : 0
      })));
    } catch (error: any) {
      console.error("Fetch cities error:", error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  app.post("/api/cities", authenticateToken, async (req: any, res) => {
    const { name, lat, lon } = req.body;
    try {
      // Check if city already exists for this user (by name and coordinates)
      const existingCity = await City.findOne({ 
        userId: req.user.id, 
        name,
        lat: { $gt: lat - 0.01, $lt: lat + 0.01 }, // Small tolerance for coordinates
        lon: { $gt: lon - 0.01, $lt: lon + 0.01 }
      });

      if (existingCity) {
        return res.status(200).json({ 
          id: existingCity._id, 
          name: existingCity.name, 
          lat: existingCity.lat, 
          lon: existingCity.lon, 
          is_favorite: existingCity.isFavorite ? 1 : 0,
          alreadyExists: true
        });
      }

      const city = new City({ userId: req.user.id, name, lat, lon });
      await city.save();
      res.status(201).json({ 
        id: city._id, 
        name, 
        lat, 
        lon, 
        is_favorite: 0 
      });
    } catch (error: any) {
      console.error("Add city error:", error);
      res.status(500).json({ error: "Failed to add city" });
    }
  });

  app.delete("/api/cities", authenticateToken, async (req: any, res) => {
    console.log(`Attempting to delete all cities for user: ${req.user.id}`);
    try {
      const result = await City.deleteMany({ userId: new mongoose.Types.ObjectId(req.user.id) });
      console.log(`Deleted ${result.deletedCount} cities for user ${req.user.id}`);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete all cities error:", error);
      res.status(500).json({ error: "Failed to delete all cities", details: error.message });
    }
  });

  app.delete("/api/cities/:id", authenticateToken, async (req: any, res) => {
    try {
      const result = await City.deleteOne({ _id: req.params.id, userId: req.user.id });
      if (result.deletedCount > 0) res.status(204).send();
      else res.status(404).json({ error: "City not found" });
    } catch (error: any) {
      console.error("Delete city error:", error);
      res.status(500).json({ error: "Failed to delete city" });
    }
  });

  app.patch("/api/cities/:id/favorite", authenticateToken, async (req: any, res) => {
    const { is_favorite } = req.body;
    try {
      const result = await City.updateOne(
        { _id: req.params.id, userId: req.user.id },
        { isFavorite: !!is_favorite }
      );
      if (result.matchedCount > 0) res.json({ success: true });
      else res.status(404).json({ error: "City not found" });
    } catch (error: any) {
      console.error("Favorite toggle error:", error);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mongo: mongoose.connection.readyState });
  });

  // Catch-all for API routes to prevent falling through to Vite
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
