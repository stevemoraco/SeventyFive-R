import { useAuth } from "@/hooks/use-auth";
import { TaskList } from "@/components/task-list";
import { BottomNav } from "@/components/bottom-nav";
import { ChallengeVariantSelector } from "@/components/challenge-variant-selector";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="pb-20">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Day {user?.currentDay}</h1>
          <ChallengeVariantSelector />
        </div>
      </div>

      <TaskList />
      <BottomNav />
    </div>
  );
}
