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
  notes?: string;
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

    // Add photo entry if it exists
    if (task.photoUrl) {
      items.push({
        id: `photo-${task.id}`,
        date: task.date,
        type: 'photo',
        content: task.notes || '',
        photoUrl: task.photoUrl,
      });
    }

    // Add a separate note entry if there's a note without a photo
    if (task.notes && !task.photoUrl) {
      items.push({
        id: `note-${task.id}`,
        date: task.date,
        type: 'note',
        content: task.notes,
      });
    }

    return items;
  });

  // Sort items by date in ascending order (oldest first)
  const sortedItems = progressItems.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ).reverse(); // Reverse to show earliest first

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Progress Updates</h2>
      <div className="grid grid-cols-3 gap-4">
        {sortedItems.map((item, index) => (
          <Card key={item.id} className="overflow-hidden flex flex-col">
            {item.type === 'photo' ? (
              <>
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
                      Day {sortedItems.length - index} - {new Date(item.date).toLocaleDateString()}
                    </div>
                    <Camera className="h-3 w-3" />
                  </div>
                </div>
                {item.content && (
                  <div className="p-3 border-t flex-1">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 h-full">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Day {sortedItems.length - index} - {new Date(item.date).toLocaleDateString()}
                  </div>
                  <MessageSquare className="h-3 w-3" />
                </div>
                <p className="text-sm whitespace-pre-wrap">{item.content}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}