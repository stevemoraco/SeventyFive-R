import { UserProgress } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Trophy, Star, Calendar, Flame, AlertTriangle, History } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { achievements as allAchievements } from "@shared/achievements";

interface AdvancedStatsProps {
  progress: UserProgress;
}

export function AdvancedStats({ progress }: AdvancedStatsProps) {
  const { user } = useAuth();
  const achievements = [
    {
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      label: "Perfect Days",
      value: progress.perfectDays,
      description: "Days with all tasks completed",
    },
    {
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      label: "Longest Streak",
      value: progress.longestStreak,
      description: "Consecutive days record",
    },
    {
      icon: <Star className="h-5 w-5 text-purple-500" />,
      label: "Total Photos",
      value: progress.totalPhotos,
      description: "Progress photos taken",
    },
    {
      icon: <Calendar className="h-5 w-5 text-green-500" />,
      label: "Challenge Day",
      value: progress.streakDays,
      description: "Current streak",
    },
  ];

  const failureStats = [
    {
      icon: <History className="h-5 w-5 text-red-500" />,
      label: "Total Restarts",
      value: progress.totalRestarts,
      description: "Times challenge restarted",
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      label: "Days Lost",
      value: progress.daysLost,
      description: "Progress lost to restarts",
    },
  ];

  // Calculate achievement progress using user's achievements
  const userAchievements = user?.achievements || {};
  const totalAchievements = allAchievements.length;
  const unlockedAchievements = Object.values(userAchievements).filter(Boolean).length;
  const achievementProgress = (unlockedAchievements / totalAchievements) * 100;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Achievements & Milestones</h2>
          <span className="text-sm text-muted-foreground">
            {unlockedAchievements} / {totalAchievements}
          </span>
        </div>
        <Progress value={achievementProgress} className="h-2 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <Card key={achievement.label} className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800">
                  {achievement.icon}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{achievement.label}</p>
                  <p className="text-xl font-semibold">{achievement.value}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {(progress.totalRestarts > 0 || progress.daysLost > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-red-500 dark:text-red-400">Wall of Shame</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {failureStats.map((stat) => (
              <Card key={stat.label} className="p-4 border-red-200 dark:border-red-900">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/20">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {progress.previousStreaks && progress.previousStreaks.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Previous Attempts:</p>
              <div className="flex flex-wrap gap-2">
                {progress.previousStreaks.map((streak, index) => (
                  <span key={index} className="px-2 py-1 text-sm bg-background rounded-full border border-red-200 dark:border-red-900">
                    {streak} days
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}