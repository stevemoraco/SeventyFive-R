import { useQuery } from "@tanstack/react-query";
import { DailyTask } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Calendar, MessageSquare, Camera } from "lucide-react";

type ProgressItem = {
  id: string;
  date: string;
  type: 'photo' | 'note';
  content: string;
  photoUrl?: string;
};

export function ProgressGallery() {
  const { data: tasks } = useQuery<DailyTask[]>({
    queryKey: ["/api/progress/photos"],
  });

  if (!tasks?.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No progress updates yet</p>
      </Card>
    );
  }

  // Create a combined list of photos and notes
  const progressItems: ProgressItem[] = tasks.flatMap(task => {
    const items: ProgressItem[] = [];

    // Add photo if exists
    if (task.photoUrl) {
      items.push({
        id: `photo-${task.id}`,
        date: task.date,
        type: 'photo',
        content: '',
        photoUrl: task.photoUrl,
      });
    }

    // Add note if exists
    if (task.notes) {
      items.push({
        id: `note-${task.id}`,
        date: task.date,
        type: 'note',
        content: task.notes,
      });
    }

    return items;
  });

  // Sort items by date in descending order (newest first)
  const sortedItems = progressItems.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Progress Updates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {sortedItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            {item.type === 'photo' ? (
              <div className="relative">
                <div className="aspect-square">
                  <img
                    src={item.photoUrl}
                    alt={`Progress photo from ${item.date}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder-image.png';
                    }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <Camera className="h-3 w-3" />
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <MessageSquare className="h-3 w-3" />
                </div>
                <p className="text-sm">{item.content}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}