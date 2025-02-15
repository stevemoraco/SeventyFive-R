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

    // Create initial progress record
    await db.insert(userProgress).values({
      userId: user.id,
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
      previousStreaks: [],
    });

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

    // Get existing progress before update
    const [oldProgress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

    const [updatedTasks] = await db.update(dailyTasks)
      .set(updates)
      .where(eq(dailyTasks.id, tasks.id))
      .returning();

    // Calculate progress updates (handling both increments and decrements)
    const workoutChange = 
      (updates.workout1Complete !== undefined ? (updates.workout1Complete ? 1 : -1) : 0) +
      (updates.workout2Complete !== undefined ? (updates.workout2Complete ? 1 : -1) : 0);

    const waterChange = updates.waterComplete !== undefined ? (updates.waterComplete ? 1 : -1) : 0;
    const readingChange = updates.readingComplete !== undefined ? (updates.readingComplete ? 10 : -10) : 0;
    const photoChange = updates.photoTaken !== undefined ? (updates.photoTaken ? 1 : -1) : 0;

    // Update progress (ensuring we don't go below 0)
    await db.update(userProgress)
      .set({
        totalWorkouts: Math.max(0, (oldProgress?.totalWorkouts || 0) + workoutChange),
        totalWaterGallons: Math.max(0, (oldProgress?.totalWaterGallons || 0) + waterChange),
        totalReadingMinutes: Math.max(0, (oldProgress?.totalReadingMinutes || 0) + readingChange),
        totalPhotos: Math.max(0, (oldProgress?.totalPhotos || 0) + photoChange),
      })
      .where(eq(userProgress.userId, userId));

    return updatedTasks;
  }

  private async updateProgress(userId: number, updates: Partial<UserProgress> | DailyTask): Promise<void> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

    // Handle reset case
    if ('stats' in updates && Object.keys(updates.stats || {}).length === 0) {
      await db.update(userProgress)
        .set({
          ...updates,
          perfectDays: 0,
          totalWorkouts: 0,
          totalWaterGallons: 0,
          totalReadingMinutes: 0,
          streakDays: 0,
          totalPhotos: 0,
          totalRestarts: 0,
          daysLost: 0,
          previousStreaks: [],
          lastRestartDate: null,
          longestStreak: 0,
        })
        .where(eq(userProgress.userId, userId));
      return;
    }

    // Handle daily task updates
    if ('date' in updates) {
      const tasks = updates as DailyTask;
      const dateStr = tasks.date;
      const currentDate = new Date(dateStr);

      // Get all tasks from the previous day
      const previousDay = new Date(currentDate);
      previousDay.setDate(previousDay.getDate() - 1);
      const [previousDayTasks] = await db.select()
        .from(dailyTasks)
        .where(and(
          eq(dailyTasks.userId, userId),
          eq(dailyTasks.date, previousDay.toISOString().split('T')[0])
        ));

      // Get existing tasks for today to prevent duplicate counting
      const [existingTasks] = await db.select()
        .from(dailyTasks)
        .where(and(
          eq(dailyTasks.userId, userId),
          eq(dailyTasks.date, dateStr)
        ));

      // Calculate current progress
      const streakDays = progress?.streakDays || 0;
      const totalWorkouts = progress?.totalWorkouts || 0;
      const totalWaterGallons = progress?.totalWaterGallons || 0;
      const totalReadingMinutes = progress?.totalReadingMinutes || 0;
      const perfectDays = progress?.perfectDays || 0;
      const totalPhotos = progress?.totalPhotos || 0;

      // Calculate increments for today's tasks
      const workoutIncrement =
        (tasks.workout1Complete && !existingTasks?.workout1Complete ? 1 : 0) +
        (tasks.workout2Complete && !existingTasks?.workout2Complete ? 1 : 0);

      const waterIncrement = tasks.waterComplete && !existingTasks?.waterComplete ? 1 : 0;
      const readingIncrement = tasks.readingComplete && !existingTasks?.readingComplete ? 10 : 0;
      const photoIncrement = tasks.photoTaken && !existingTasks?.photoTaken ? 1 : 0;

      // Check if all tasks are complete for perfect day counting
      const isAllComplete = tasks.workout1Complete &&
        (!this.requiresSecondWorkout(tasks) || tasks.workout2Complete) &&
        tasks.waterComplete &&
        tasks.readingComplete &&
        tasks.dietComplete &&
        (!this.requiresPhoto(tasks) || tasks.photoTaken);

      const perfectDayIncrement = isAllComplete && !this.wasAlreadyPerfect(existingTasks) ? 1 : 0;

      await db.update(userProgress)
        .set({
          totalWorkouts: totalWorkouts + workoutIncrement,
          totalWaterGallons: totalWaterGallons + waterIncrement,
          totalReadingMinutes: totalReadingMinutes + readingIncrement,
          perfectDays: perfectDays + perfectDayIncrement,
          totalPhotos: totalPhotos + photoIncrement,
        })
        .where(eq(userProgress.userId, userId));

      await this.checkAndUpdateAchievements(userId, {
        ...progress,
        totalWorkouts: totalWorkouts + workoutIncrement,
        totalWaterGallons: totalWaterGallons + waterIncrement,
        totalReadingMinutes: totalReadingMinutes + readingIncrement,
        perfectDays: perfectDays + perfectDayIncrement,
        totalPhotos: totalPhotos + photoIncrement,
      } as UserProgress);
      return;
    }

    // Handle other progress updates
    if (!progress) {
      await db.insert(userProgress).values({
        userId,
        ...updates,
      });
    } else {
      await db.update(userProgress)
        .set(updates)
        .where(eq(userProgress.userId, userId));
    }

    await this.checkAndUpdateAchievements(userId, {
      ...progress,
      ...updates,
    } as UserProgress);
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

  private requiresSecondWorkout(tasks: DailyTask): boolean {
    // Check if the task requires a second workout based on challenge type
    return true; // For now, always require second workout for 75 Hard
  }

  private requiresPhoto(tasks: DailyTask): boolean {
    // Check if the task requires a photo based on challenge type
    return true; // For now, always require photo for 75 Hard
  }

  private wasAlreadyPerfect(existingTasks: DailyTask | undefined): boolean {
    if (!existingTasks) return false;
    return existingTasks.workout1Complete &&
      existingTasks.workout2Complete &&
      existingTasks.waterComplete &&
      existingTasks.readingComplete &&
      existingTasks.dietComplete &&
      existingTasks.photoTaken;
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