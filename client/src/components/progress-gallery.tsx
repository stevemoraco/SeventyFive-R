import { useQuery } from "@tanstack/react-query";
import { DailyTask } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Calendar, MessageSquare } from "lucide-react";

export function ProgressGallery() {
  const { data: photos } = useQuery<DailyTask[]>({
    queryKey: ["/api/progress/photos"],
  });

  if (!photos?.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No progress photos yet</p>
      </Card>
    );
  }

  // Sort photos by date in descending order (newest first)
  const sortedPhotos = [...photos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Progress Photos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedPhotos.map((photo) => (
          <div key={photo.id}>
            {photo.photoUrl && (
              <div className="mb-4">
                <div className="relative">
                  <img
                    src={photo.photoUrl}
                    alt={`Progress photo from day ${photo.id}`}
                    className="w-full rounded-lg object-cover aspect-square"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder-image.png';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(photo.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {photo.notes && (
                  <Card className="mt-2 p-4">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{photo.notes}</p>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}