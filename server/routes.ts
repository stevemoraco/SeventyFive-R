import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertDailyTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/tasks/today", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.getDailyTasks(req.user.id, new Date());
    res.json(tasks);
  });

  app.patch("/api/tasks/today", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.updateDailyTasks(req.user.id, new Date(), req.body);
    res.json(tasks);
  });

  app.get("/api/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const progress = await storage.getUserProgress(req.user.id);
    res.json(progress);
  });

  app.get("/api/progress/photos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const photos = await storage.getUserPhotos(req.user.id);
    res.json(photos);
  });

  app.patch("/api/user/challenge", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.updateUser(req.user.id, { challengeType: req.body.challengeType });
    res.json(user);
  });

  const httpServer = createServer(app);
  return httpServer;
}
