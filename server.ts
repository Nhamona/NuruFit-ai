import express from "express";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin
  try {
    let serviceAccount;
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountEnv) {
      if (serviceAccountEnv.trim().startsWith("{")) {
        serviceAccount = JSON.parse(serviceAccountEnv);
      } else {
        const serviceAccountPath = path.resolve(__dirname, serviceAccountEnv);
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
        } else {
          console.warn(`Firebase service account file not found at: ${serviceAccountPath}`);
        }
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin initialized successfully");
    } else {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT environment variable not set or invalid. Firebase Admin not initialized."
      );
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }

  // API routes FIRST
  app.use(express.json()); // Enable JSON body parsing

  // Middleware to verify Firebase ID Token from Flutter/Web clients
  const authenticateFirebase = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      if (!admin.apps.length) throw new Error("Firebase Admin not initialized");
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
  };

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "NuruFit Backend" });
  });

  // Flutter Integration Endpoint: Sync User Data
  // Flutter app sends: GET /api/flutter/sync with Authorization: Bearer <ID_TOKEN>
  app.get("/api/flutter/sync", authenticateFirebase, async (req: any, res) => {
    try {
      const uid = req.user.uid;
      const userRecord = await admin.auth().getUser(uid);
      
      // Fetch user profile from Firestore
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      res.json({
        message: "Sync successful",
        user: {
          uid: uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          profile: userData
        },
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // Example admin route
  app.get("/api/admin/users", async (req, res) => {
    if (!admin.apps.length) {
      return res.status(500).json({ error: "Firebase Admin not initialized" });
    }
    try {
      const listUsersResult = await admin.auth().listUsers(100);
      res.json(listUsersResult.users);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ error: "Failed to list users" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
