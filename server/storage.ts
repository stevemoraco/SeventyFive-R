import { users, dailyTasks, userProgress, type User, type InsertUser, type DailyTask, type UserProgress } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      startDate: new Date().toISOString(),
      currentDay: 1,
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getDailyTasks(userId: number, date: Date): Promise<DailyTask> {
    const dateStr = date.toISOString().split('T')[0];
    const [tasks] = await db.select()
      .from(dailyTasks)
      .where(eq(dailyTasks.userId, userId))
      .where(eq(dailyTasks.date, dateStr));

    if (!tasks) {
      const [newTasks] = await db.insert(dailyTasks).values({
        userId,
        date: dateStr,
        workout1Complete: false,
        workout2Complete: false,
        waterComplete: false,
        readingComplete: false,
        dietComplete: false,
        photoTaken: false,
        photoUrl: null,
        notes: null,
      }).returning();
      return newTasks;
    }

    return tasks;
  }

  async updateDailyTasks(userId: number, date: Date, updates: Partial<DailyTask>): Promise<DailyTask> {
    const dateStr = date.toISOString().split('T')[0];
    let tasks = await this.getDailyTasks(userId, date);

    const [updatedTasks] = await db.update(dailyTasks)
      .set(updates)
      .where(eq(dailyTasks.id, tasks.id))
      .returning();

    await this.updateProgress(userId, updatedTasks);
    return updatedTasks;
  }

  private async updateProgress(userId: number, tasks: DailyTask) {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

    // Calculate streak
    const dateStr = tasks.date;
    const [previousDayTasks] = await db.select()
      .from(dailyTasks)
      .where(eq(dailyTasks.userId, userId))
      .where(eq(dailyTasks.date, new Date(new Date(dateStr).getTime() - 86400000).toISOString().split('T')[0]));

    let streakDays = 0;
    let longestStreak = progress?.longestStreak || 0;
    let perfectDays = progress?.perfectDays || 0;
    let totalPhotos = progress?.totalPhotos || 0;

    if (progress) {
      streakDays = progress.streakDays;

      // Check if all tasks are complete for today
      const isTodayComplete = tasks.workout1Complete && 
                          tasks.workout2Complete && 
                          tasks.waterComplete && 
                          tasks.readingComplete && 
                          tasks.dietComplete && 
                          tasks.photoTaken;

      // Check if yesterday was complete (if it exists)
      const wasYesterdayComplete = previousDayTasks && 
                                previousDayTasks.workout1Complete && 
                                previousDayTasks.workout2Complete && 
                                previousDayTasks.waterComplete && 
                                previousDayTasks.readingComplete && 
                                previousDayTasks.dietComplete && 
                                previousDayTasks.photoTaken;

      // Update streak and perfect days
      if (isTodayComplete) {
        if (wasYesterdayComplete || !previousDayTasks) {
          streakDays += 1;
          if (streakDays > longestStreak) {
            longestStreak = streakDays;
          }
        }
        perfectDays += 1;
      } else if (wasYesterdayComplete) {
        streakDays = 0;
      }

      // Update total photos
      if (tasks.photoTaken && tasks.photoUrl) {
        totalPhotos += 1;
      }
    }

    if (!progress) {
      await db.insert(userProgress).values({
        userId,
        totalWorkouts: (tasks.workout1Complete ? 1 : 0) + (tasks.workout2Complete ? 1 : 0),
        totalWaterGallons: tasks.waterComplete ? 1 : 0,
        totalReadingMinutes: tasks.readingComplete ? 10 : 0,
        streakDays: streakDays,
        perfectDays: perfectDays,
        longestStreak: longestStreak,
        totalPhotos: totalPhotos,
        stats: {},
      });
    } else {
      await db.update(userProgress)
        .set({
          totalWorkouts: progress.totalWorkouts + ((tasks.workout1Complete ? 1 : 0) + (tasks.workout2Complete ? 1 : 0)),
          totalWaterGallons: progress.totalWaterGallons + (tasks.waterComplete ? 1 : 0),
          totalReadingMinutes: progress.totalReadingMinutes + (tasks.readingComplete ? 10 : 0),
          streakDays: streakDays,
          perfectDays: perfectDays,
          longestStreak: longestStreak,
          totalPhotos: totalPhotos,
        })
        .where(eq(userProgress.id, progress.id));
    }
  }

  async getUserProgress(userId: number): Promise<UserProgress> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

    if (!progress) {
      const [newProgress] = await db.insert(userProgress).values({
        userId,
        totalWorkouts: 0,
        totalWaterGallons: 0,
        totalReadingMinutes: 0,
        streakDays: 0,
        stats: {},
        perfectDays: 0,
        longestStreak: 0,
        totalPhotos: 0,
      }).returning();
      return newProgress;
    }

    return progress;
  }

  async getUserPhotos(userId: number): Promise<DailyTask[]> {
    return db.select()
      .from(dailyTasks)
      .where(eq(dailyTasks.userId, userId))
      .where(eq(dailyTasks.photoTaken, true));
  }
}

export const storage = new DatabaseStorage();