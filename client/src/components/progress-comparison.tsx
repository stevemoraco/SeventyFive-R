import { useQuery } from "@tanstack/react-query";
import { ProgressPhoto } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function ProgressComparison() {
  const { user } = useAuth();
  const { data: photos } = useQuery<ProgressPhoto[]>({
    queryKey: ["/api/progress/photos"],
    enabled: !!user, // Only fetch if user is logged in
  });

  // Don't render anything if user is not logged in or no photos data
  if (!user || !photos) {
    return null;
  }

  // Don't render if there are no photos
  if (photos.length === 0) {
    return null;
  }

  // Since photos are in reverse chronological order, we need to swap the indices
  const firstPhoto = photos[photos.length - 1]; // Earliest photo (Day 1)
  const latestPhoto = photos[0]; // Most recent photo

  // Only show if we have different photos
  if (!firstPhoto?.photoUrl || !latestPhoto?.photoUrl || firstPhoto.id === latestPhoto.id) {
    return null;
  }

  const shareProgress = async () => {
    try {
      await navigator.share({
        title: "My 75 Hard Progress",
        text: `Check out my progress on the 75 Hard Challenge! From Day 1 to Day ${photos.length}`,
        url: window.location.href,
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Progress So Far</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={shareProgress}
          className="text-muted-foreground"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={firstPhoto.photoUrl}
                alt="Day 1"
                className="h-full w-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = '/placeholder-image.png';
                }}
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">Day 1</p>
          </div>
          <div className="space-y-2">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={latestPhoto.photoUrl}
                alt={`Day ${photos.length}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = '/placeholder-image.png';
                }}
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Day {photos.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}