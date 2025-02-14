import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { ReminderSettings, TaskReminder } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Bell, BellOff, Clock } from "lucide-react";

const AVAILABLE_TASKS = [
  { id: "workout1", label: "First Workout" },
  { id: "workout2", label: "Second Workout" },
  { id: "water", label: "Water Intake" },
  { id: "reading", label: "Reading" },
  { id: "diet", label: "Diet Check" },
  { id: "photo", label: "Progress Photo" },
];

export function ReminderSettingsCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const defaultReminders: Record<string, TaskReminder> = {
    workout1: { time: "09:00", enabled: false, additionalReminders: [] },
    workout2: { time: "16:00", enabled: false, additionalReminders: [] },
    water: { time: "08:00", enabled: false, additionalReminders: [] },
    reading: { time: "20:00", enabled: false, additionalReminders: [] },
    diet: { time: "07:00", enabled: false, additionalReminders: [] },
    photo: { time: "21:00", enabled: false, additionalReminders: [] },
  };

  const reminderSettings = {
    taskReminders: {
      ...defaultReminders,
      ...(user?.reminderSettings as ReminderSettings)?.taskReminders,
    },
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: ReminderSettings) => {
      const res = await apiRequest("PATCH", "/api/user", {
        reminderSettings: settings,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Reminder Settings Updated",
        description: "Your reminder preferences have been saved.",
      });
    },
  });

  const handleToggleReminder = (taskId: string, enabled: boolean) => {
    const updatedSettings = {
      taskReminders: {
        ...reminderSettings.taskReminders,
        [taskId]: {
          ...reminderSettings.taskReminders[taskId],
          enabled,
        },
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleTimeChange = (taskId: string, time: string, index?: number) => {
    const taskReminder = reminderSettings.taskReminders[taskId];
    const updatedSettings = {
      taskReminders: {
        ...reminderSettings.taskReminders,
        [taskId]: {
          ...taskReminder,
          time: index === undefined ? time : taskReminder.time,
          additionalReminders: index !== undefined
            ? taskReminder.additionalReminders.map((reminder, i) => 
                i === index ? { ...reminder, time } : reminder
              )
            : taskReminder.additionalReminders,
        },
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const addAdditionalReminder = (taskId: string) => {
    const taskReminder = reminderSettings.taskReminders[taskId];
    const updatedSettings = {
      taskReminders: {
        ...reminderSettings.taskReminders,
        [taskId]: {
          ...taskReminder,
          additionalReminders: [
            ...taskReminder.additionalReminders,
            { time: taskReminder.time, enabled: true },
          ],
        },
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const removeAdditionalReminder = (taskId: string, index: number) => {
    const taskReminder = reminderSettings.taskReminders[taskId];
    const updatedSettings = {
      taskReminders: {
        ...reminderSettings.taskReminders,
        [taskId]: {
          ...taskReminder,
          additionalReminders: taskReminder.additionalReminders.filter((_, i) => i !== index),
        },
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const toggleAdditionalReminder = (taskId: string, index: number, enabled: boolean) => {
    const taskReminder = reminderSettings.taskReminders[taskId];
    const updatedSettings = {
      taskReminders: {
        ...reminderSettings.taskReminders,
        [taskId]: {
          ...taskReminder,
          additionalReminders: taskReminder.additionalReminders.map((reminder, i) =>
            i === index ? { ...reminder, enabled } : reminder
          ),
        },
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daily Task Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {AVAILABLE_TASKS.map((task) => {
            const reminder = reminderSettings.taskReminders[task.id];
            const isExpanded = expandedTask === task.id;

            return (
              <div key={task.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {reminder.enabled ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="font-medium">{task.label}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="time"
                      value={reminder.time}
                      onChange={(e) => handleTimeChange(task.id, e.target.value)}
                      className="w-32"
                      disabled={!reminder.enabled}
                    />
                    <Switch
                      checked={reminder.enabled}
                      onCheckedChange={(checked) => handleToggleReminder(task.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    >
                      {isExpanded ? "Hide" : "More"}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Additional Reminders</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addAdditionalReminder(task.id)}
                        disabled={!reminder.enabled}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Reminder
                      </Button>
                    </div>

                    {reminder.additionalReminders.map((additionalReminder, index) => (
                      <div key={index} className="flex items-center space-x-4 pl-4">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <Input
                          type="time"
                          value={additionalReminder.time}
                          onChange={(e) => handleTimeChange(task.id, e.target.value, index)}
                          className="w-32"
                          disabled={!reminder.enabled || !additionalReminder.enabled}
                        />
                        <Switch
                          checked={additionalReminder.enabled}
                          onCheckedChange={(checked) => 
                            toggleAdditionalReminder(task.id, index, checked)
                          }
                          disabled={!reminder.enabled}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdditionalReminder(task.id, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}