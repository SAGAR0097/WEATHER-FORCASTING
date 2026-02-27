import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import Database from 'better-sqlite3';
import crypto from 'crypto';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const USE_MONGO = !!process.env.MONGODB_URI;

// SQLite Fallback for Persistence during Development
const sqlite = new Database('local.db');
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  );
  CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    lat REAL,
    lon REAL,
    isFavorite INTEGER DEFAULT 0
  );
`);

// MongoDB Connection (Optional)
async function connectToDatabase() {
  if (!USE_MONGO) {
    console.log("Using persistent SQLite for local development.");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

// connectToDatabase(); // Moved to bootstrap

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
    const normalizedUsername = username?.toLowerCase().trim();
    console.log(`Registration attempt for username: ${normalizedUsername}`);
    
    try {
      if (!normalizedUsername || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      if (USE_MONGO) {
        const existingUser = await User.findOne({ username: normalizedUsername });
        if (existingUser) return res.status(400).json({ error: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username: normalizedUsername, password: hashedPassword });
        await user.save();
        
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
        return res.status(201).json({ token, user: { id: user._id, username: user.username } });
      } else {
        const existing = sqlite.prepare('SELECT id FROM users WHERE username = ?').get(normalizedUsername);
        if (existing) return res.status(400).json({ error: "Username already exists" });

        const id = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, 10);
        sqlite.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(id, normalizedUsername, hashedPassword);
        
        const token = jwt.sign({ id, username: normalizedUsername }, JWT_SECRET);
        return res.status(201).json({ token, user: { id, username: normalizedUsername } });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error during registration" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const normalizedUsername = username?.toLowerCase().trim();
    try {
      if (USE_MONGO) {
        const user = await User.findOne({ username: normalizedUsername });
        if (user && await bcrypt.compare(password, user.password)) {
          const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
          return res.json({ token, user: { id: user._id, username: user.username } });
        }
      } else {
        const user: any = sqlite.prepare('SELECT * FROM users WHERE username = ?').get(normalizedUsername);
        if (user && await bcrypt.compare(password, user.password)) {
          const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
          return res.json({ token, user: { id: user.id, username: user.username } });
        }
      }
      res.status(401).json({ error: "Invalid credentials" });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error during login" });
    }
  });

  // City Routes
  app.get("/api/cities", authenticateToken, async (req: any, res) => {
    try {
      if (USE_MONGO) {
        const cities = await City.find({ userId: req.user.id });
        return res.json(cities.map(c => ({
          id: c._id,
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          is_favorite: c.isFavorite ? 1 : 0
        })));
      } else {
        const cities: any = sqlite.prepare('SELECT * FROM cities WHERE userId = ?').all(req.user.id);
        return res.json(cities.map((c: any) => ({
          id: c.id,
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          is_favorite: c.isFavorite
        })));
      }
    } catch (error: any) {
      console.error("Fetch cities error:", error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  app.post("/api/cities", authenticateToken, async (req: any, res) => {
    const { name, lat, lon } = req.body;
    try {
      if (USE_MONGO) {
        const existingCity = await City.findOne({ 
          userId: req.user.id, 
          name,
          lat: { $gt: lat - 0.01, $lt: lat + 0.01 },
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
        return res.status(201).json({ id: city._id, name, lat, lon, is_favorite: 0 });
      } else {
        const existing: any = sqlite.prepare('SELECT * FROM cities WHERE userId = ? AND name = ?').get(req.user.id, name);
        if (existing) {
          return res.status(200).json({ ...existing, is_favorite: existing.isFavorite, alreadyExists: true });
        }

        const id = crypto.randomUUID();
        sqlite.prepare('INSERT INTO cities (id, userId, name, lat, lon, isFavorite) VALUES (?, ?, ?, ?, ?, 0)')
          .run(id, req.user.id, name, lat, lon);
        return res.status(201).json({ id, name, lat, lon, is_favorite: 0 });
      }
    } catch (error: any) {
      console.error("Add city error:", error);
      res.status(500).json({ error: "Failed to add city" });
    }
  });

  app.delete("/api/cities", authenticateToken, async (req: any, res) => {
    try {
      if (USE_MONGO) {
        await City.deleteMany({ userId: req.user.id });
      } else {
        sqlite.prepare('DELETE FROM cities WHERE userId = ?').run(req.user.id);
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete all cities error:", error);
      res.status(500).json({ error: "Failed to delete all cities" });
    }
  });

  app.delete("/api/cities/:id", authenticateToken, async (req: any, res) => {
    try {
      if (USE_MONGO) {
        const result = await City.deleteOne({ _id: req.params.id, userId: req.user.id });
        if (result.deletedCount > 0) return res.status(204).send();
      } else {
        const result = sqlite.prepare('DELETE FROM cities WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
        if (result.changes > 0) return res.status(204).send();
      }
      res.status(404).json({ error: "City not found" });
    } catch (error: any) {
      console.error("Delete city error:", error);
      res.status(500).json({ error: "Failed to delete city" });
    }
  });

  app.patch("/api/cities/:id/favorite", authenticateToken, async (req: any, res) => {
    const { is_favorite } = req.body;
    try {
      if (USE_MONGO) {
        const result = await City.updateOne(
          { _id: req.params.id, userId: req.user.id },
          { isFavorite: !!is_favorite }
        );
        if (result.matchedCount > 0) return res.json({ success: true });
      } else {
        const result = sqlite.prepare('UPDATE cities SET isFavorite = ? WHERE id = ? AND userId = ?')
          .run(is_favorite ? 1 : 0, req.params.id, req.user.id);
        if (result.changes > 0) return res.json({ success: true });
      }
      res.status(404).json({ error: "City not found" });
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

async function bootstrap() {
  console.log("Server: Bootstrapping...");
  await connectToDatabase();
  console.log("Server: Database connected, starting server...");
  await startServer();
  console.log("Server: Bootstrap complete.");
}

bootstrap();
