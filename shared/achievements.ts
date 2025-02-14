import { Trophy, Flame, Star, Dumbbell, Droplet, Book } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof achievementIcons;
  requirement: {
    type: 'streak' | 'perfectDays' | 'workouts' | 'water' | 'reading' | 'photos';
    count: number;
  };
}

export const achievementIcons = {
  trophy: Trophy,
  flame: Flame,
  star: Star,
  dumbbell: Dumbbell,
  droplet: Droplet,
  book: Book,
};

export const achievements: Achievement[] = [
  {
    id: 'first_week',
    name: 'First Week Champion',
    description: 'Complete 7 consecutive days',
    icon: 'flame',
    requirement: { type: 'streak', count: 7 },
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all tasks for 7 consecutive days',
    icon: 'trophy',
    requirement: { type: 'perfectDays', count: 7 },
  },
  {
    id: 'workout_warrior',
    name: 'Workout Warrior',
    description: 'Complete 50 workouts',
    icon: 'dumbbell',
    requirement: { type: 'workouts', count: 50 },
  },
  {
    id: 'hydration_master',
    name: 'Hydration Master',
    description: 'Complete water goal for 30 days',
    icon: 'droplet',
    requirement: { type: 'water', count: 30 },
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read for 1000 minutes',
    icon: 'book',
    requirement: { type: 'reading', count: 1000 },
  },
  {
    id: 'progress_tracker',
    name: 'Progress Tracker',
    description: 'Take 30 progress photos',
    icon: 'star',
    requirement: { type: 'photos', count: 30 },
  },
  // New achievements for perseverance
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Return and achieve a 7-day streak after a restart',
    icon: 'trophy',
    requirement: { type: 'streak', count: 7 },
  },
  {
    id: 'perseverance_master',
    name: 'Perseverance Master',
    description: 'Complete a 14-day streak after any number of restarts',
    icon: 'flame',
    requirement: { type: 'streak', count: 14 },
  },
  {
    id: 'ultimate_warrior',
    name: 'Ultimate Warrior',
    description: 'Complete a 30-day streak regardless of past failures',
    icon: 'star',
    requirement: { type: 'streak', count: 30 },
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Complete 75 days with perfect task completion',
    icon: 'trophy',
    requirement: { type: 'perfectDays', count: 75 },
  },
];