import { pgTable, text, serial, integer, boolean, date, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  challengeType: text("challenge_type").notNull().default("75hard"),
  startDate: text("start_date"),
  currentDay: integer("current_day").default(1),
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
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalWorkouts: integer("total_workouts").default(0).notNull(),
  totalWaterGallons: integer("total_water_gallons").default(0).notNull(),
  totalReadingMinutes: integer("total_reading_minutes").default(0).notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  stats: json("stats").default({}).notNull(),
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