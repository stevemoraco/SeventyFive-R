import { useAuth } from "@/hooks/use-auth";
import { achievements, achievementIcons } from "@shared/achievements";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AchievementsList() {
  const { user } = useAuth();
  const userAchievements = user?.achievements as Record<string, boolean> ?? {};

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Achievements</h2>
      <div className="grid grid-cols-2 gap-4">
        {achievements.map((achievement) => {
          const Icon = achievementIcons[achievement.icon];
          const isUnlocked = userAchievements[achievement.id];

          return (
            <Card
              key={achievement.id}
              className={cn(
                "p-4",
                !isUnlocked && "opacity-50"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-full",
                  isUnlocked ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
