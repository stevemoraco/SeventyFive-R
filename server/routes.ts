import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertDailyTaskSchema } from "@shared/schema";
import multer from "multer";
import { randomBytes } from "crypto";
import path from "path";
import express from "express";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storageMulter = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString("hex")}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storageMulter });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve static files from client/public directory
  app.use(express.static(path.join(process.cwd(), "client", "public")));

  app.get("/api/tasks/today", async (req, res) => {
    const userId = req.user?.id || 0;
    const tasks = await storage.getDailyTasks(userId, new Date());
    res.json(tasks);
  });

  app.patch("/api/tasks/today", async (req, res) => {
    const userId = req.user?.id || 0;
    const tasks = await storage.updateDailyTasks(userId, new Date(), req.body);
    res.json(tasks);
  });

  app.get("/api/progress", async (req, res) => {
    if (!req.user) return res.json({
      totalWorkouts: 0,
      totalWaterGallons: 0,
      totalReadingMinutes: 0,
      streakDays: 0,
      stats: {}
    });
    const progress = await storage.getUserProgress(req.user.id);
    res.json(progress);
  });

  app.post("/api/tasks/today/photo", upload.single("photo"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Please sign in to upload photos" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const photoUrl = `/uploads/${req.file.filename}`;
    const dateStr = new Date().toISOString().split('T')[0];

    // Add the photo to progress photos
    const photo = await storage.addProgressPhoto(
      req.user.id,
      dateStr,
      photoUrl,
      req.body.notes
    );

    // Update daily tasks to mark photo as taken
    const tasks = await storage.updateDailyTasks(req.user.id, new Date(), {
      photoTaken: true,
    });

    res.json({ photo, tasks });
  });

  app.get("/api/progress/photos", async (req, res) => {
    console.log("Fetching photos for user:", req.user?.id);
    if (!req.user) {
      console.log("No authenticated user");
      return res.json([]);
    }
    const photos = await storage.getProgressPhotos(req.user.id);
    console.log("Found photos:", photos.length);
    res.json(photos);
  });

  app.post("/api/challenges/custom", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Please sign in to create custom challenges" });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const customChallenges = (user.customChallenges as any[]) || [];
    customChallenges.push(req.body);

    await storage.updateUser(user.id, {
      customChallenges,
    });

    res.status(201).json(req.body);
  });

  app.patch("/api/user/challenge", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const updateData: Partial<User> = {
      challengeType: req.body.challengeType,
      currentDay: req.body.currentDay || 1,
    };

    // If switching to a custom challenge, store the challenge ID
    if (req.body.challengeType === "custom" && req.body.customChallengeId) {
      updateData.currentCustomChallengeId = req.body.customChallengeId;
    } else {
      // Clear the custom challenge ID when switching to a built-in variant
      updateData.currentCustomChallengeId = null;
    }

    const user = await storage.updateUser(req.user.id, updateData);
    res.json(user);
  });


  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const updateData: Partial<User> = {};
    if (req.body.reminderSettings) {
      updateData.reminderSettings = req.body.reminderSettings;
    }
    if (req.body.challengeType) {
      updateData.challengeType = req.body.challengeType;
      updateData.currentDay = req.body.currentDay || 1;
      if (req.body.challengeType === "custom" && req.body.customChallengeId) {
        updateData.currentCustomChallengeId = req.body.customChallengeId;
      } else {
        updateData.currentCustomChallengeId = null;
      }
    }

    const user = await storage.updateUser(req.user.id, updateData);
    res.json(user);
  });

  app.patch("/api/theme", (req, res) => {
    const themeFile = path.join(process.cwd(), "theme.json");
    const theme = JSON.parse(fs.readFileSync(themeFile, "utf8"));

    if (req.body.appearance) {
      theme.appearance = req.body.appearance;
    }
    if (req.body.primary) {
      theme.primary = req.body.primary;
    }

    fs.writeFileSync(themeFile, JSON.stringify(theme, null, 2));
    res.json(theme);
  });

  const httpServer = createServer(app);
  return httpServer;
}