import { useAuth } from "@/hooks/use-auth";
import { TaskList } from "@/components/task-list";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CustomChallenge } from "@shared/schema";
import { PageHeader } from "@/components/page-header";
import { DashboardHeader } from "@/components/dashboard-header";

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
      <DashboardHeader />
      <PageHeader title={getChallengeName()}>
        {!user && (
          <Link href="/auth">
            <Button variant="outline" size="sm">Sign up to save progress</Button>
          </Link>
        )}
      </PageHeader>

      <TaskList />
      <BottomNav />
    </div>
  );
}