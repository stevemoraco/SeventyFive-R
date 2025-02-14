import { useAuth } from "@/hooks/use-auth";
import { TaskList } from "@/components/task-list";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CustomChallenge } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();

  const getChallengeName = () => {
    if (user?.challengeType === "custom") {
      const customChallenges = user.customChallenges as CustomChallenge[] || [];
      const activeChallenge = customChallenges.find(c => c.id === user.currentCustomChallengeId);
      return activeChallenge?.name || "Custom Challenge";
    } else {
      return user?.challengeType === "75soft" ? "75 Soft Challenge" : "75 Hard Challenge";
    }
  };

  return (
    <div className="pb-20">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold">{getChallengeName()}</h1>
            {user && <p className="text-sm text-gray-500">Day {user.currentDay}</p>}
          </div>
          {!user && (
            <Link href="/auth">
              <Button variant="outline" size="sm">Sign up to save progress</Button>
            </Link>
          )}
        </div>
      </div>

      <TaskList />
      <BottomNav />
    </div>
  );
}