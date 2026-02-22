import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("trendsbox.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    title TEXT,
    excerpt TEXT,
    content TEXT,
    type TEXT,
    category TEXT,
    imageUrl TEXT,
    sources TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generationId TEXT,
    rating INTEGER,
    comment TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS usage (
    date TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/usage", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    let row = db.prepare("SELECT count FROM usage WHERE date = ?").get(today) as { count: number } | undefined;
    if (!row) {
      db.prepare("INSERT INTO usage (date, count) VALUES (?, 0)").run(today);
      row = { count: 0 };
    }
    res.json(row);
  });

  app.get("/api/history", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM history ORDER BY timestamp DESC").all();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/history", (req, res) => {
    try {
      const { id, title, excerpt, content, type, category, imageUrl, sources } = req.body;
      const stmt = db.prepare(`
        INSERT INTO history (id, title, excerpt, content, type, category, imageUrl, sources)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, title, excerpt, content, type, category, imageUrl, JSON.stringify(sources));
      
      // Increment usage
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO usage (date, count) 
        VALUES (?, 1) 
        ON CONFLICT(date) DO UPDATE SET count = count + 1
      `).run(today);
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  app.delete("/api/history/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM history WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete history" });
    }
  });

  app.post("/api/feedback", (req, res) => {
    try {
      const { generationId, rating, comment } = req.body;
      db.prepare("INSERT INTO feedback (generationId, rating, comment) VALUES (?, ?, ?)").run(generationId, rating, comment);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      // Fallback if dist doesn't exist yet
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
