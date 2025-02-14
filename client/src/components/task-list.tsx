import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DailyTask, CustomChallenge } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Camera, Dumbbell, Droplet, Book, Apple, PenLine, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PhotoUpload } from "./photo-upload";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function TaskList() {
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const is75Soft = user?.challengeType === "75soft";
  const isCustomChallenge = user?.challengeType === "custom";

  const { data: tasks } = useQuery<DailyTask>({
    queryKey: ["/api/tasks/today"],
  });

  // Get the active custom challenge if one is selected
  const activeCustomChallenge = isCustomChallenge && user.customChallenges 
    ? (user.customChallenges as CustomChallenge[]).find(c => c.id === user.currentCustomChallengeId)
    : null;

  useEffect(() => {
    if (tasks) {
      setNotes(tasks.notes || "");
      let requiredTasks: boolean[] = [];

      if (isCustomChallenge && activeCustomChallenge) {
        // Custom challenge tasks
        if (activeCustomChallenge.workouts > 0) requiredTasks.push(tasks.workout1Complete);
        if (activeCustomChallenge.workouts > 1) requiredTasks.push(tasks.workout2Complete);
        if (activeCustomChallenge.waterAmount > 0) requiredTasks.push(tasks.waterComplete);
        if (activeCustomChallenge.readingMinutes > 0) requiredTasks.push(tasks.readingComplete);
        if (activeCustomChallenge.dietType !== 'none') requiredTasks.push(tasks.dietComplete);
        if (activeCustomChallenge.requirePhoto) requiredTasks.push(tasks.photoTaken);

        // Add custom task completion status
        const customTasksComplete = tasks.customTasksComplete as Record<string, boolean> || {};
        activeCustomChallenge.customTasks.forEach(task => {
          requiredTasks.push(customTasksComplete[task.id] || false);
        });
      } else if (is75Soft) {
        // 75 Soft tasks
        requiredTasks = [
          tasks.workout1Complete,
          tasks.waterComplete,
          tasks.readingComplete,
          tasks.dietComplete,
        ];
      } else {
        // 75 Hard tasks
        requiredTasks = [
          tasks.workout1Complete,
          tasks.workout2Complete,
          tasks.waterComplete,
          tasks.readingComplete,
          tasks.dietComplete,
          tasks.photoTaken,
        ];
      }

      const completedTasks = requiredTasks.filter(Boolean).length;
      setProgress((completedTasks / requiredTasks.length) * 100);
    }
  }, [tasks, is75Soft, isCustomChallenge, activeCustomChallenge, user?.currentCustomChallengeId]);

  const updateTaskMutation = useMutation({
    mutationFn: async (taskUpdate: Partial<DailyTask>) => {
      const res = await apiRequest("PATCH", "/api/tasks/today", taskUpdate);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/today"] });
    },
  });

  const handleTaskToggle = (task: keyof DailyTask | string, checked: boolean) => {
    if (task.startsWith('custom_')) {
      // Handle custom task toggle
      const customTasksComplete = { 
        ...(tasks?.customTasksComplete as Record<string, boolean> || {}),
        [task.replace('custom_', '')]: checked 
      };
      updateTaskMutation.mutate({ customTasksComplete });
    } else {
      // Handle built-in task toggle
      updateTaskMutation.mutate({ [task]: checked });
    }
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
          {isCustomChallenge && activeCustomChallenge ? (
            // Custom Challenge Tasks
            <>
              {activeCustomChallenge.workouts > 0 && (
                <TaskItem
                  icon={<Dumbbell className="h-5 w-5" />}
                  label={`Workout ${activeCustomChallenge.outdoorWorkout ? '(Outdoor)' : ''}`}
                  checked={tasks?.workout1Complete}
                  onChange={(checked) => handleTaskToggle("workout1Complete", checked)}
                />
              )}
              {activeCustomChallenge.workouts > 1 && (
                <TaskItem
                  icon={<Dumbbell className="h-5 w-5" />}
                  label="Second Workout"
                  checked={tasks?.workout2Complete}
                  onChange={(checked) => handleTaskToggle("workout2Complete", checked)}
                />
              )}
              {activeCustomChallenge.waterAmount > 0 && (
                <TaskItem
                  icon={<Droplet className="h-5 w-5" />}
                  label={`Drink ${activeCustomChallenge.waterAmount} Gallon(s) of Water`}
                  checked={tasks?.waterComplete}
                  onChange={(checked) => handleTaskToggle("waterComplete", checked)}
                />
              )}
              {activeCustomChallenge.readingMinutes > 0 && (
                <TaskItem
                  icon={<Book className="h-5 w-5" />}
                  label={`Read for ${activeCustomChallenge.readingMinutes} Minutes`}
                  checked={tasks?.readingComplete}
                  onChange={(checked) => handleTaskToggle("readingComplete", checked)}
                />
              )}
              {activeCustomChallenge.dietType !== 'none' && (
                <TaskItem
                  icon={<Apple className="h-5 w-5" />}
                  label={`Follow ${activeCustomChallenge.dietType === 'strict' ? 'Strict' : 'Flexible'} Diet`}
                  checked={tasks?.dietComplete}
                  onChange={(checked) => handleTaskToggle("dietComplete", checked)}
                />
              )}
              {activeCustomChallenge.requirePhoto && (
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
              )}
              {/* Custom Tasks */}
              {activeCustomChallenge.customTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  icon={<Check className="h-5 w-5" />}
                  label={task.name}
                  description={task.description}
                  checked={(tasks?.customTasksComplete as Record<string, boolean>)?.[task.id] || false}
                  onChange={(checked) => handleTaskToggle(`custom_${task.id}`, checked)}
                />
              ))}
            </>
          ) : (
            // Default 75 Hard/Soft Tasks
            <>
              <TaskItem
                icon={<Dumbbell className="h-5 w-5" />}
                label={is75Soft ? "45 Min Workout" : "First Workout"}
                checked={tasks?.workout1Complete}
                onChange={(checked) => handleTaskToggle("workout1Complete", checked)}
              />

              {!is75Soft && (
                <TaskItem
                  icon={<Dumbbell className="h-5 w-5" />}
                  label="Second Workout (Outdoor)"
                  checked={tasks?.workout2Complete}
                  onChange={(checked) => handleTaskToggle("workout2Complete", checked)}
                />
              )}

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
                label={is75Soft ? "Follow Diet Plan" : "Follow Strict Diet"}
                checked={tasks?.dietComplete}
                onChange={(checked) => handleTaskToggle("dietComplete", checked)}
              />

              {!is75Soft && (
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
              )}
            </>
          )}

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
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div>{label}</div>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}