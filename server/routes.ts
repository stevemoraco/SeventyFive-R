import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertDailyTaskSchema } from "@shared/schema";
import multer from "multer";
import { randomBytes } from "crypto";
import path from "path";
import express from "express";

const storageMulter = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString("hex")}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storageMulter });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/tasks/today", async (req, res) => {
    const userId = req.user?.id || 0; // Use 0 for anonymous users
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

  app.get("/api/progress/photos", async (req, res) => {
    if (!req.user) return res.json([]);
    const photos = await storage.getUserPhotos(req.user.id);
    res.json(photos);
  });

  app.patch("/api/user/challenge", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.updateUser(req.user.id, { challengeType: req.body.challengeType });
    res.json(user);
  });

  app.post("/api/tasks/today/photo", upload.single("photo"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Please sign in to upload photos" });
    if (!req.file) return res.status(400).send("No file uploaded");

    const photoUrl = `/uploads/${req.file.filename}`;
    const tasks = await storage.updateDailyTasks(req.user.id, new Date(), {
      photoTaken: true,
      photoUrl,
    });

    res.json(tasks);
  });

  app.use("/uploads", express.static("uploads"));

  const httpServer = createServer(app);
  return httpServer;
}