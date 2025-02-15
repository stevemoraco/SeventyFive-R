import { useQuery } from "@tanstack/react-query";
import { UserProgress } from "@shared/schema";
import { BottomNav } from "@/components/bottom-nav";
import { ProgressComparison } from "@/components/progress-comparison";
import { ProgressGallery } from "@/components/progress-gallery";
import { AdvancedStats } from "@/components/advanced-stats";
import { Card } from "@/components/ui/card";
import { Trophy, Dumbbell, Droplet, Book } from "lucide-react";
import { AchievementsList } from "@/components/achievements-list";
import { PageHeader } from "@/components/page-header";

export default function ProgressPage() {
  const { data: progress } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
  });

  if (!progress) return null;

  // Calculate more meaningful statistics
  const workoutHours = progress.totalWorkouts; // Assuming 1 hour per workout
  const pagesRead = Math.round(progress.totalReadingMinutes * 2); // Assuming 2 pages per minute
  const waterLiters = Math.round(progress.totalWaterGallons * 3.78541); // Convert gallons to liters

  return (
    <div className="pb-20">
      <PageHeader title="Progress" />

      <div className="p-4 space-y-6">
        <ProgressComparison />

        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            icon={<Trophy className="h-5 w-5 text-yellow-500" />}
            label="Current Streak"
            value={progress.streakDays}
            unit="days"
          />
          <StatsCard
            icon={<Dumbbell className="h-5 w-5 text-purple-500" />}
            label="Time Training"
            value={workoutHours}
            unit="hours"
          />
          <StatsCard
            icon={<Droplet className="h-5 w-5 text-blue-500" />}
            label="Water Consumed"
            value={waterLiters}
            unit="liters"
          />
          <StatsCard
            icon={<Book className="h-5 w-5 text-green-500" />}
            label="Pages Read"
            value={pagesRead}
            unit="pages"
          />
        </div>

        <AdvancedStats progress={progress} />
        <AchievementsList />
        <ProgressGallery />
      </div>

      <BottomNav />
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-full bg-gray-50">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-xl font-semibold">
            {value.toLocaleString()} <span className="text-sm font-normal text-gray-500">{unit}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}