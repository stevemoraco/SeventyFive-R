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
import { TaskCompletion, DayCompletion } from "./celebration-effects";
import { useNotifications } from "@/hooks/use-notifications";

export function TaskList() {
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const [lastClickPosition, setLastClickPosition] = useState({ x: 0, y: 0 });
  const [showTaskConfetti, setShowTaskConfetti] = useState(false);
  const [showDayCompletion, setShowDayCompletion] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const is75Soft = user?.challengeType === "75soft";
  const isCustomChallenge = user?.challengeType === "custom";
  const { requestPermission, scheduleTaskReminders } = useNotifications();

  const { data: tasks } = useQuery<DailyTask>({
    queryKey: ["/api/tasks/today"],
  });

  // Get the active custom challenge if one is selected
  const activeCustomChallenge = isCustomChallenge && user.customChallenges
    ? (user.customChallenges as CustomChallenge[]).find(c => c.id === user.currentCustomChallengeId)
    : null;

  useEffect(() => {
    // Request notification permission immediately when component mounts
    const setupNotifications = async () => {
      const granted = await requestPermission();
      if (granted) {
        toast({
          title: "Reminders enabled",
          description: "You'll receive notifications for incomplete tasks throughout the day.",
        });
      }
    };
    setupNotifications();
  }, [requestPermission, toast]);

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
      const newProgress = (completedTasks / requiredTasks.length) * 100;
      setProgress(newProgress);

      // Show day completion celebration if all tasks are complete and we haven't shown it yet today
      if (newProgress === 100 && !completedToday) {
        setCompletedToday(true);
        setShowDayCompletion(true);
      } else if (newProgress < 100) {
        setCompletedToday(false);
      }
    }
  }, [tasks, is75Soft, isCustomChallenge, activeCustomChallenge, user?.currentCustomChallengeId, completedToday]);

  useEffect(() => {
    if (!tasks) return;

    // Get incomplete tasks
    const incompleteTasks: string[] = [];

    if (isCustomChallenge && activeCustomChallenge) {
      // Check custom challenge tasks
      if (activeCustomChallenge.workouts > 0 && !tasks.workout1Complete) {
        incompleteTasks.push('First Workout');
      }
      if (activeCustomChallenge.workouts > 1 && !tasks.workout2Complete) {
        incompleteTasks.push('Second Workout');
      }
      if (activeCustomChallenge.waterAmount > 0 && !tasks.waterComplete) {
        incompleteTasks.push(`${activeCustomChallenge.waterAmount} Gallon(s) of Water`);
      }
      if (activeCustomChallenge.readingMinutes > 0 && !tasks.readingComplete) {
        incompleteTasks.push(`${activeCustomChallenge.readingMinutes} Minutes of Reading`);
      }
      if (activeCustomChallenge.dietType !== 'none' && !tasks.dietComplete) {
        incompleteTasks.push('Diet');
      }
      if (activeCustomChallenge.requirePhoto && !tasks.photoTaken) {
        incompleteTasks.push('Progress Photo');
      }
      // Add custom tasks
      const customTasksComplete = tasks.customTasksComplete as Record<string, boolean> || {};
      activeCustomChallenge.customTasks.forEach(task => {
        if (!customTasksComplete[task.id]) {
          incompleteTasks.push(task.name);
        }
      });
    } else {
      // Check default tasks
      if (!tasks.workout1Complete) {
        incompleteTasks.push(is75Soft ? '45 Min Workout' : 'First Workout');
      }
      if (!is75Soft && !tasks.workout2Complete) {
        incompleteTasks.push('Second Workout (Outdoor)');
      }
      if (!tasks.waterComplete) {
        incompleteTasks.push('Water');
      }
      if (!tasks.readingComplete) {
        incompleteTasks.push('Reading');
      }
      if (!tasks.dietComplete) {
        incompleteTasks.push(is75Soft ? 'Diet Plan' : 'Strict Diet');
      }
      if (!is75Soft && !tasks.photoTaken) {
        incompleteTasks.push('Progress Photo');
      }
    }

    // Schedule reminders for incomplete tasks
    scheduleTaskReminders(incompleteTasks);

    // Check every 3 hours
    const checkInterval = setInterval(() => {
      scheduleTaskReminders(incompleteTasks);
    }, 3 * 60 * 60 * 1000);

    return () => clearInterval(checkInterval);
  }, [tasks, is75Soft, isCustomChallenge, activeCustomChallenge, scheduleTaskReminders]);

  const updateTaskMutation = useMutation({
    mutationFn: async (taskUpdate: Partial<DailyTask>) => {
      const res = await apiRequest("PATCH", "/api/tasks/today", taskUpdate);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
  });

  const handleTaskToggle = (task: keyof DailyTask | string, checked: boolean, event: any) => {
    if (checked) {
      // Only show confetti when checking a task
      const element = event?.target?.closest('.task-item');
      if (element) {
        const rect = element.getBoundingClientRect();
        setLastClickPosition({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        });
        setShowTaskConfetti(true);
        setTimeout(() => setShowTaskConfetti(false), 2000);
      }
    }

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

      {showTaskConfetti && <TaskCompletion x={lastClickPosition.x} y={lastClickPosition.y} />}
      <DayCompletion open={showDayCompletion} onOpenChange={setShowDayCompletion} />

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
                  onChange={(checked, e) => handleTaskToggle("workout1Complete", checked, e)}
                />
              )}
              {activeCustomChallenge.workouts > 1 && (
                <TaskItem
                  icon={<Dumbbell className="h-5 w-5" />}
                  label="Second Workout"
                  checked={tasks?.workout2Complete}
                  onChange={(checked, e) => handleTaskToggle("workout2Complete", checked, e)}
                />
              )}
              {activeCustomChallenge.waterAmount > 0 && (
                <TaskItem
                  icon={<Droplet className="h-5 w-5" />}
                  label={`Drink ${activeCustomChallenge.waterAmount} Gallon(s) of Water`}
                  checked={tasks?.waterComplete}
                  onChange={(checked, e) => handleTaskToggle("waterComplete", checked, e)}
                />
              )}
              {activeCustomChallenge.readingMinutes > 0 && (
                <TaskItem
                  icon={<Book className="h-5 w-5" />}
                  label={`Read for ${activeCustomChallenge.readingMinutes} Minutes`}
                  checked={tasks?.readingComplete}
                  onChange={(checked, e) => handleTaskToggle("readingComplete", checked, e)}
                />
              )}
              {activeCustomChallenge.dietType !== 'none' && (
                <TaskItem
                  icon={<Apple className="h-5 w-5" />}
                  label={`Follow ${activeCustomChallenge.dietType === 'strict' ? 'Strict' : 'Flexible'} Diet`}
                  checked={tasks?.dietComplete}
                  onChange={(checked, e) => handleTaskToggle("dietComplete", checked, e)}
                />
              )}
              {activeCustomChallenge.requirePhoto && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 task-item">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div className="flex-1">Progress Photo</div>
                    <Checkbox
                      checked={tasks?.photoTaken}
                      onCheckedChange={(checked) => handleTaskToggle("photoTaken", checked as boolean, { target: { closest: (sel: string) => document.querySelector(sel) } })}
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
                  onChange={(checked, e) => handleTaskToggle(`custom_${task.id}`, checked, e)}
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
                onChange={(checked, e) => handleTaskToggle("workout1Complete", checked, e)}
              />

              {!is75Soft && (
                <TaskItem
                  icon={<Dumbbell className="h-5 w-5" />}
                  label="Second Workout (Outdoor)"
                  checked={tasks?.workout2Complete}
                  onChange={(checked, e) => handleTaskToggle("workout2Complete", checked, e)}
                />
              )}

              <TaskItem
                icon={<Droplet className="h-5 w-5" />}
                label="Drink Water"
                checked={tasks?.waterComplete}
                onChange={(checked, e) => handleTaskToggle("waterComplete", checked, e)}
              />

              <TaskItem
                icon={<Book className="h-5 w-5" />}
                label="Read 10 Pages"
                checked={tasks?.readingComplete}
                onChange={(checked, e) => handleTaskToggle("readingComplete", checked, e)}
              />

              <TaskItem
                icon={<Apple className="h-5 w-5" />}
                label={is75Soft ? "Follow Diet Plan" : "Follow Strict Diet"}
                checked={tasks?.dietComplete}
                onChange={(checked, e) => handleTaskToggle("dietComplete", checked, e)}
              />

              {!is75Soft && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 task-item">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div className="flex-1">Progress Photo</div>
                    <Checkbox
                      checked={tasks?.photoTaken}
                      onCheckedChange={(checked) => handleTaskToggle("photoTaken", checked as boolean, { target: { closest: (sel: string) => document.querySelector(sel) } })}
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
  onChange: (checked: boolean, event: any) => void;
}) {
  return (
    <div className="flex items-center space-x-4 task-item">
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
        onCheckedChange={(checked) => onChange(checked as boolean, { target: { closest: (sel: string) => document.querySelector(sel) } })}
      />
    </div>
  );
}