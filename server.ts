import express from "express";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes FIRST
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  
  const DB_PATH = path.resolve(process.cwd(), "server_db.json");
  let db_data = {
    registeredUsers: [],
    sharedAffiches: [],
    sharedProducts: [],
    sharedMarkets: [],
    sharedTeam: []
  };

  if (fs.existsSync(DB_PATH)) {
    try {
      db_data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch (e) {
      console.error("Failed to load server_db.json", e);
    }
  }

  function saveDB() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db_data, null, 2));
    } catch (e) {
      console.error("Failed to save server_db.json", e);
    }
  }

  app.post("/api/register", (req, res) => {
    db_data.registeredUsers.push(req.body);
    saveDB();
    res.json({ success: true });
  });
  app.get("/api/registered-users", (req, res) => {
    res.json(db_data.registeredUsers);
  });

  // Affiches API
  app.get("/api/affiches", (req, res) => {
    res.json(db_data.sharedAffiches);
  });
  app.post("/api/affiches", (req, res) => {
    db_data.sharedAffiches = req.body;
    saveDB();
    res.json({ success: true });
  });

  // Products API
  app.get("/api/products", (req, res) => {
    res.json(db_data.sharedProducts);
  });
  app.post("/api/products", (req, res) => {
    db_data.sharedProducts = req.body;
    saveDB();
    res.json({ success: true });
  });

  // Markets API
  app.get("/api/markets", (req, res) => {
    res.json(db_data.sharedMarkets);
  });
  app.post("/api/markets", (req, res) => {
    db_data.sharedMarkets = req.body;
    saveDB();
    res.json({ success: true });
  });

  // Team API
  app.get("/api/team", (req, res) => {
    res.json(db_data.sharedTeam);
  });
  app.post("/api/team", (req, res) => {
    db_data.sharedTeam = req.body;
    saveDB();
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    // we use a dynamic import because vite may not be present in production dependencies
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(process.cwd(), "dist");
    
    // Check if dist exists to provide better errors if build is missing
    import("fs").then(fs => {
      if (!fs.existsSync(distPath)) {
        console.error("DIST directory not found! Have you run 'build'?");
      }
    });

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
