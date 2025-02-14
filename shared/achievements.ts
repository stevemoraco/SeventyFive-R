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
];
