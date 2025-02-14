import { useQuery } from "@tanstack/react-query";
import { DailyTask } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export function ProgressComparison() {
  const { data: photos } = useQuery<DailyTask[]>({
    queryKey: ["/api/progress/photos"],
  });

  // Debug log to check what photos we're getting
  console.log('Progress photos:', photos);

  // Return null only if we have no photos at all
  if (!photos || photos.length === 0) {
    console.log('No photos available');
    return null;
  }

  const firstPhoto = photos[0];
  const latestPhoto = photos[photos.length - 1];

  // Only hide if they're the exact same photo
  if (!firstPhoto?.photoUrl || !latestPhoto?.photoUrl || firstPhoto.id === latestPhoto.id) {
    console.log('Same photo or missing URLs');
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
      // Sharing failed or was cancelled
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