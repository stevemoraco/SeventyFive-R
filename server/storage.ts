import { users, dailyTasks, userProgress, type User, type InsertUser, type DailyTask, type UserProgress } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getDailyTasks(userId: number, date: Date): Promise<DailyTask>;
  updateDailyTasks(userId: number, date: Date, updates: Partial<DailyTask>): Promise<DailyTask>;
  getUserProgress(userId: number): Promise<UserProgress>;
  getUserPhotos(userId: number): Promise<DailyTask[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<string, DailyTask>;
  private progress: Map<number, UserProgress>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.progress = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      startDate: new Date().toISOString(),
      currentDay: 1
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getDailyTasks(userId: number, date: Date): Promise<DailyTask> {
    const key = `${userId}-${date.toISOString().split('T')[0]}`;
    let tasks = this.tasks.get(key);

    if (!tasks) {
      tasks = {
        id: this.currentId++,
        userId,
        date: date.toISOString().split('T')[0],
        workout1Complete: false,
        workout2Complete: false,
        waterComplete: false,
        readingComplete: false,
        dietComplete: false,
        photoTaken: false,
        photoUrl: null,
        notes: null
      };
      this.tasks.set(key, tasks);
    }

    return tasks;
  }

  async updateDailyTasks(userId: number, date: Date, updates: Partial<DailyTask>): Promise<DailyTask> {
    const key = `${userId}-${date.toISOString().split('T')[0]}`;
    const existing = await this.getDailyTasks(userId, date);
    const updated = { ...existing, ...updates };
    this.tasks.set(key, updated);
    await this.updateProgress(userId, updated);
    return updated;
  }

  private async updateProgress(userId: number, tasks: DailyTask) {
    let progress = this.progress.get(userId);
    if (!progress) {
      progress = {
        id: this.currentId++,
        userId,
        totalWorkouts: 0,
        totalWaterGallons: 0,
        totalReadingMinutes: 0,
        streakDays: 0,
        stats: {},
      };
    }

    // Update progress based on completed tasks
    progress.totalWorkouts += (tasks.workout1Complete ? 1 : 0) + (tasks.workout2Complete ? 1 : 0);
    progress.totalWaterGallons += tasks.waterComplete ? 1 : 0;
    progress.totalReadingMinutes += tasks.readingComplete ? 10 : 0;

    this.progress.set(userId, progress);
  }

  async getUserProgress(userId: number): Promise<UserProgress> {
    let progress = this.progress.get(userId);
    if (!progress) {
      progress = {
        id: this.currentId++,
        userId,
        totalWorkouts: 0,
        totalWaterGallons: 0,
        totalReadingMinutes: 0,
        streakDays: 0,
        stats: {},
      };
      this.progress.set(userId, progress);
    }
    return progress;
  }

  async getUserPhotos(userId: number): Promise<DailyTask[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId && task.photoTaken && task.photoUrl)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
  }
}

export const storage = new MemStorage();