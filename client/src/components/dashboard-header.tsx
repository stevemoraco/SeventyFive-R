import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

export function DashboardHeader() {
  const { user } = useAuth();
  const currentDay = 1; // Always Day 1
  const today = new Date();
  const formattedDate = format(today, "'Progress for Day' d '—' EEEE, MMMM do, yyyy");

  // Fetch daily tasks to calculate progress
  const { data: dailyTasks } = useQuery({
    queryKey: ["/api/tasks/today"],
    select: (data: Record<string, unknown>) => {
      const completedTasks = Object.values(data).filter(value => 
        typeof value === 'boolean' && value
      ).length;
      const totalTasks = Object.values(data).filter(value => 
        typeof value === 'boolean'
      ).length;
      return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    },
  });

  // Calculate daily progress based on completed tasks
  const dailyProgress = dailyTasks || 0;
  const totalProgress = (currentDay / 75) * 100;

  return (
    <div className="bg-background border-b px-6 py-6">
      <h1 className="text-3xl font-bold tracking-tight">SeventyFive</h1>
      <p className="text-muted-foreground mt-2">{formattedDate}</p>

      <div className="flex items-center gap-8 mt-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16">
            <Progress 
              value={dailyProgress}
              className="h-16 w-16 rounded-full [&>div]:rounded-full"
              indicatorClassName="bg-primary transition-all"
            />
            <div className="absolute inset-0 flex items-center justify-center text-base font-medium">
              {Math.round(dailyProgress)}%
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Today</span>
            <span className="text-xs text-muted-foreground">Daily Progress</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16">
            <Progress 
              value={totalProgress}
              className="h-16 w-16 rounded-full [&>div]:rounded-full"
              indicatorClassName="bg-primary transition-all"
            />
            <div className="absolute inset-0 flex items-center justify-center text-base font-medium">
              {Math.round(totalProgress)}%
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Challenge</span>
            <span className="text-xs text-muted-foreground">Total Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}