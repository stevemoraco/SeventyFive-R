import { useQuery } from "@tanstack/react-query";
import { UserProgress } from "@shared/schema";
import { BottomNav } from "@/components/bottom-nav";
import { ProgressGallery } from "@/components/progress-gallery";
import { Card } from "@/components/ui/card";
import { Trophy, Dumbbell, Droplet, Book } from "lucide-react";

export default function ProgressPage() {
  const { data: progress } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
  });

  return (
    <div className="pb-20">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Progress</h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            icon={<Trophy className="h-5 w-5 text-yellow-500" />}
            label="Streak"
            value={progress?.streakDays || 0}
            unit="days"
          />
          <StatsCard
            icon={<Dumbbell className="h-5 w-5 text-purple-500" />}
            label="Workouts"
            value={progress?.totalWorkouts || 0}
            unit="completed"
          />
          <StatsCard
            icon={<Droplet className="h-5 w-5 text-blue-500" />}
            label="Water"
            value={progress?.totalWaterGallons || 0}
            unit="gallons"
          />
          <StatsCard
            icon={<Book className="h-5 w-5 text-green-500" />}
            label="Reading"
            value={progress?.totalReadingMinutes || 0}
            unit="minutes"
          />
        </div>

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
  unit 
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
            {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
