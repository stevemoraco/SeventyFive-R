import { UserProgress } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Trophy, Star, Calendar, Flame } from "lucide-react";

interface AdvancedStatsProps {
  progress: UserProgress;
}

export function AdvancedStats({ progress }: AdvancedStatsProps) {
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Achievements & Milestones</h2>
      <div className="grid grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.label} className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-gray-50">
                {achievement.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{achievement.label}</p>
                <p className="text-xl font-semibold">{achievement.value}</p>
                <p className="text-xs text-gray-500">{achievement.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
