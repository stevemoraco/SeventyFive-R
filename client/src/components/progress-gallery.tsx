import { useQuery } from "@tanstack/react-query";
import { DailyTask } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Progress Photos</h2>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="aspect-square relative">
            <img
              src={photo.photoUrl}
              alt={`Progress photo from day ${photo.id}`}
              className="object-cover rounded-lg w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg flex items-center justify-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(photo.date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
