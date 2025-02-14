import { pgTable, text, serial, integer, boolean, date, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface TaskReminder {
  time: string; // 24h format HH:mm
  enabled: boolean;
  additionalReminders: Array<{
    time: string;
    enabled: boolean;
  }>;
}

export interface ReminderSettings {
  taskReminders: Record<string, TaskReminder>;
  panicMode: {
    enabled: boolean;
    time: string; // When to check for incomplete tasks
    intervalMinutes: number; // How often to send reminders for incomplete tasks
  };
}

export interface CustomChallenge {
  id: string;
  name: string;
  description: string;
  workouts: number;
  outdoorWorkout: boolean;
  waterAmount: number;
  readingMinutes: number;
  requirePhoto: boolean;
  dietType: 'strict' | 'flexible' | 'none';
  customTasks: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  stats: {
    currentUsers: number;
    totalCompletions: number;
  };
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  challengeType: text("challenge_type").notNull().default("75hard"),
  startDate: text("start_date"),
  currentDay: integer("current_day").default(1),
  achievements: json("achievements").default({}).notNull(),
  customChallenges: json("custom_challenges").default([]).notNull(),
  currentCustomChallengeId: text("current_custom_challenge_id"),
  challengeStats: json("challenge_stats").default({
    "75hard": { currentUsers: 0, totalCompletions: 0 },
    "75soft": { currentUsers: 0, totalCompletions: 0 }
  }).notNull(),
  reminderSettings: json("reminder_settings").default({
    taskReminders: {
      workout1: { time: "09:00", enabled: false, additionalReminders: [] },
      workout2: { time: "16:00", enabled: false, additionalReminders: [] },
      water: { time: "08:00", enabled: false, additionalReminders: [] },
      reading: { time: "20:00", enabled: false, additionalReminders: [] },
      diet: { time: "07:00", enabled: false, additionalReminders: [] },
      photo: { time: "21:00", enabled: false, additionalReminders: [] }
    },
    panicMode: {
      enabled: false,
      time: "21:00",
      intervalMinutes: 30
    }
  }).notNull(),
});

export const dailyTasks = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  workout1Complete: boolean("workout1_complete").default(false).notNull(),
  workout2Complete: boolean("workout2_complete").default(false).notNull(),
  waterComplete: boolean("water_complete").default(false).notNull(),
  readingComplete: boolean("reading_complete").default(false).notNull(),
  dietComplete: boolean("diet_complete").default(false).notNull(),
  photoTaken: boolean("photo_taken").default(false).notNull(),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  customTasksComplete: json("custom_tasks_complete").default({}).notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalWorkouts: integer("total_workouts").default(0).notNull(),
  totalWaterGallons: integer("total_water_gallons").default(0).notNull(),
  totalReadingMinutes: integer("total_reading_minutes").default(0).notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  stats: json("stats").default({}).notNull(),
  perfectDays: integer("perfect_days").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalPhotos: integer("total_photos").default(0).notNull(),
  // Add new fields for tracking failures
  totalRestarts: integer("total_restarts").default(0).notNull(),
  daysLost: integer("days_lost").default(0).notNull(),
  lastRestartDate: text("last_restart_date"),
  previousStreaks: json("previous_streaks").default([]).notNull(), // Array of previous streak lengths
});

// Add new table for photos
export const progressPhotos = pgTable("progress_photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  photoUrl: text("photo_url").notNull(),
  timestamp: text("timestamp").notNull(),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  challengeType: true,
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks);
export const insertProgressSchema = createInsertSchema(userProgress);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type ProgressPhoto = typeof progressPhotos.$inferSelect;
export const insertProgressPhotoSchema = createInsertSchema(progressPhotos);