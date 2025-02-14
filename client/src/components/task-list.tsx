import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DailyTask } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Camera, Dumbbell, Droplet, Book, Apple, PenLine } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PhotoUpload } from "./photo-upload";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function TaskList() {
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const { data: tasks } = useQuery<DailyTask>({
    queryKey: ["/api/tasks/today"],
  });

  useEffect(() => {
    if (tasks) {
      setNotes(tasks.notes || "");
      const completedTasks = [
        tasks.workout1Complete,
        tasks.workout2Complete,
        tasks.waterComplete,
        tasks.readingComplete,
        tasks.dietComplete,
        tasks.photoTaken,
      ].filter(Boolean).length;

      setProgress((completedTasks / 6) * 100);
    }
  }, [tasks]);

  const updateTaskMutation = useMutation({
    mutationFn: async (taskUpdate: Partial<DailyTask>) => {
      const res = await apiRequest("PATCH", "/api/tasks/today", taskUpdate);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/today"] });
    },
  });

  const handleTaskToggle = (task: keyof DailyTask, checked: boolean) => {
    updateTaskMutation.mutate({ [task]: checked });
  };

  const handleSaveNotes = () => {
    updateTaskMutation.mutate({ notes });
    toast({
      title: "Notes saved",
      description: "Your notes for today have been saved.",
    });
  };

  return (
    <div className="space-y-4 p-4">
      <Progress value={progress} className="w-full h-2" />

      <Card className="p-4">
        <div className="space-y-4">
          <TaskItem
            icon={<Dumbbell className="h-5 w-5" />}
            label="First Workout"
            checked={tasks?.workout1Complete}
            onChange={(checked) => handleTaskToggle("workout1Complete", checked)}
          />

          <TaskItem
            icon={<Dumbbell className="h-5 w-5" />}
            label="Second Workout"
            checked={tasks?.workout2Complete}
            onChange={(checked) => handleTaskToggle("workout2Complete", checked)}
          />

          <TaskItem
            icon={<Droplet className="h-5 w-5" />}
            label="Drink Water"
            checked={tasks?.waterComplete}
            onChange={(checked) => handleTaskToggle("waterComplete", checked)}
          />

          <TaskItem
            icon={<Book className="h-5 w-5" />}
            label="Read 10 Pages"
            checked={tasks?.readingComplete}
            onChange={(checked) => handleTaskToggle("readingComplete", checked)}
          />

          <TaskItem
            icon={<Apple className="h-5 w-5" />}
            label="Follow Diet"
            checked={tasks?.dietComplete}
            onChange={(checked) => handleTaskToggle("dietComplete", checked)}
          />

          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <Camera className="h-5 w-5" />
              </div>
              <div className="flex-1">Progress Photo</div>
              <Checkbox
                checked={tasks?.photoTaken}
                onCheckedChange={(checked) => handleTaskToggle("photoTaken", checked as boolean)}
              />
            </div>
            <PhotoUpload />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PenLine className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium">Daily Notes</span>
              </div>
              <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
            </div>
            <Textarea
              placeholder="Add notes about your workouts, diet, or general progress..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function TaskItem({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1">{label}</div>
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}