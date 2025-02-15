import { users, dailyTasks, userProgress, progressPhotos, type User, type InsertUser, type DailyTask, type UserProgress, type CustomChallenge, type ProgressPhoto } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
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
  addProgressPhoto(userId: number, date: string, photoUrl: string, notes?: string): Promise<ProgressPhoto>;
  getProgressPhotos(userId: number): Promise<ProgressPhoto[]>;
  getAllCustomChallenges(): Promise<CustomChallenge[]>;
  getChallengeStats(): Promise<Record<string, { currentUsers: number; totalCompletions: number }>>;
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
    const oldUser = await this.getUser(id);
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");

    // Update challenge stats when challenge type changes
    if (updates.challengeType && oldUser?.challengeType !== updates.challengeType) {
      // Decrease count for old challenge
      if (oldUser) {
        const oldStats = oldUser.challengeStats as Record<string, any>;
        if (oldStats[oldUser.challengeType]) {
          oldStats[oldUser.challengeType].currentUsers--;
          await db.update(users)
            .set({ challengeStats: oldStats })
            .where(eq(users.id, oldUser.id));
        }
      }

      // Increase count for new challenge
      const stats = user.challengeStats as Record<string, any>;
      if (updates.challengeType === 'custom') {
        const customChallenges = user.customChallenges as CustomChallenge[];
        const challenge = customChallenges.find(c => c.id === updates.currentCustomChallengeId);
        if (challenge) {
          challenge.stats = challenge.stats || { currentUsers: 0, totalCompletions: 0 };
          challenge.stats.currentUsers++;
          await db.update(users)
            .set({ customChallenges })
            .where(eq(users.id, user.id));
        }
      } else if (stats[updates.challengeType]) {
        stats[updates.challengeType].currentUsers++;
        await db.update(users)
          .set({ challengeStats: stats })
          .where(eq(users.id, user.id));
      }
    }

    return user;
  }

  async getDailyTasks(userId: number, date: Date): Promise<DailyTask> {
    const dateStr = date.toISOString().split('T')[0];
    const [tasks] = await db.select()
      .from(dailyTasks)
      .where(and(
        eq(dailyTasks.userId, userId),
        eq(dailyTasks.date, dateStr)
      ));

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

  private async updateProgress(userId: number, updates: Partial<UserProgress>): Promise<void> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

    if (!progress) {
      await db.insert(userProgress).values({
        userId,
        ...updates,
        stats: {},
      });
    } else {
      await db.update(userProgress)
        .set(updates)
        .where(eq(userProgress.userId, userId));
    }

    // Only check achievements if we're not resetting
    if (!updates.hasOwnProperty('stats')) {
      await this.checkAndUpdateAchievements(userId, {
        ...progress,
        ...updates,
      } as UserProgress);
    }
  }

  private async checkAndUpdateAchievements(userId: number, progress: UserProgress) {
    const user = await this.getUser(userId);
    if (!user) return;

    const userAchievements = user.achievements as Record<string, boolean> || {};
    let achievementsUpdated = false;

    const { achievements } = await import("@shared/achievements");

    achievements.forEach((achievement) => {
      if (userAchievements[achievement.id]) return;

      let requirement = achievement.requirement;
      let achieved = false;

      // Only check achievements if the required stats are present
      switch (requirement.type) {
        case 'streak':
          if (progress.streakDays === undefined) return;
          if (achievement.id === 'comeback_king') {
            achieved = progress.streakDays >= requirement.count && progress.totalRestarts > 0;
          } else if (achievement.id === 'perseverance_master') {
            achieved = progress.streakDays >= requirement.count && progress.totalRestarts > 0;
          } else if (achievement.id === 'ultimate_warrior') {
            achieved = progress.streakDays >= requirement.count;
          } else {
            achieved = progress.streakDays >= requirement.count;
          }
          break;
        case 'perfectDays':
          if (progress.perfectDays === undefined) return;
          achieved = progress.perfectDays >= requirement.count;
          break;
        case 'workouts':
          if (progress.totalWorkouts === undefined) return;
          achieved = progress.totalWorkouts >= requirement.count;
          break;
        case 'water':
          if (progress.totalWaterGallons === undefined) return;
          achieved = progress.totalWaterGallons >= requirement.count;
          break;
        case 'reading':
          if (progress.totalReadingMinutes === undefined) return;
          achieved = progress.totalReadingMinutes >= requirement.count;
          break;
        case 'photos':
          if (progress.totalPhotos === undefined) return;
          achieved = progress.totalPhotos >= requirement.count;
          break;
      }

      if (achieved) {
        userAchievements[achievement.id] = true;
        achievementsUpdated = true;
      }
    });

    if (achievementsUpdated) {
      await this.updateUser(userId, {
        achievements: userAchievements,
      });
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
        totalRestarts: 0,
        daysLost: 0,
        lastRestartDate: null,
        previousStreaks: [],
      }).returning();
      return newProgress;
    }

    return progress;
  }

  async getUserPhotos(userId: number): Promise<DailyTask[]> {
    return db.select()
      .from(dailyTasks)
      .where(and(
        eq(dailyTasks.userId, userId),
        eq(dailyTasks.photoTaken, true)
      ));
  }

  async addProgressPhoto(userId: number, date: string, photoUrl: string, notes?: string): Promise<ProgressPhoto> {
    const [photo] = await db.insert(progressPhotos)
      .values({
        userId,
        date,
        photoUrl,
        timestamp: new Date().toISOString(),
        notes,
      })
      .returning();
    return photo;
  }

  async getProgressPhotos(userId: number): Promise<ProgressPhoto[]> {
    return db.select()
      .from(progressPhotos)
      .where(eq(progressPhotos.userId, userId))
      .orderBy(desc(progressPhotos.timestamp));
  }

  async getAllCustomChallenges(): Promise<CustomChallenge[]> {
    // Fetch all users to collect their custom challenges
    const allUsers = await db.select().from(users);
    const allChallenges: CustomChallenge[] = [];

    // Collect unique custom challenges from all users
    allUsers.forEach(user => {
      const userChallenges = user.customChallenges as CustomChallenge[];
      if (Array.isArray(userChallenges)) {
        userChallenges.forEach(challenge => {
          if (!allChallenges.some(c => c.id === challenge.id)) {
            allChallenges.push(challenge);
          }
        });
      }
    });

    return allChallenges;
  }

  async getChallengeStats(): Promise<Record<string, { currentUsers: number; totalCompletions: number }>> {
    // Fetch all users to collect challenge statistics
    const allUsers = await db.select().from(users);
    const stats: Record<string, { currentUsers: number; totalCompletions: number }> = {};

    // Aggregate stats from all users
    allUsers.forEach(user => {
      const userStats = user.challengeStats as Record<string, { currentUsers: number; totalCompletions: number }>;
      if (userStats) {
        Object.entries(userStats).forEach(([challengeType, typeStat]) => {
          if (!stats[challengeType]) {
            stats[challengeType] = { currentUsers: 0, totalCompletions: 0 };
          }
          stats[challengeType].currentUsers = typeStat.currentUsers || 0;
          stats[challengeType].totalCompletions = typeStat.totalCompletions || 0;
        });
      }
    });

    return stats;
  }
}

export const storage = new DatabaseStorage();