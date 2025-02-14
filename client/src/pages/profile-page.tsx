import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChallengeGallery } from "@/components/challenge-gallery";
import { CustomChallengeCreator } from "@/components/custom-challenge-creator";
import { User, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="pb-20">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Profile & Settings</h1>
      </div>

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
              <ChallengeGallery />

              <div className="pt-4 border-t">
                <CustomChallengeCreator />
              </div>

              <Button
                variant="destructive"
                className="w-full"
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