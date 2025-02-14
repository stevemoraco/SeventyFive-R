import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChallengeGallery } from "@/components/challenge-gallery";
import { CustomChallengeCreator } from "@/components/custom-challenge-creator";
import { ReminderSettingsCard } from "@/components/reminder-settings";
import { PageHeader } from "@/components/page-header";
import { User, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="pb-20">
      <PageHeader title="Profile & Settings" />

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-medium">{user?.username}</h2>
                <p className="text-sm text-gray-500">Day {user?.currentDay}</p>
              </div>
            </div>

            <div className="space-y-6">
              <ReminderSettingsCard />

              <div className="border-t pt-6">
                <ChallengeGallery />
              </div>

              <div className="pt-4 border-t">
                <CustomChallengeCreator />
              </div>

              <Button
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}