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
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Bell, BellOff, Clock, AlertTriangle } from "lucide-react";

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

  const defaultPanicMode = {
    enabled: false,
    time: "21:00",
    intervalMinutes: 30
  };

  const reminderSettings = {
    taskReminders: {
      ...defaultReminders,
      ...(user?.reminderSettings as ReminderSettings)?.taskReminders,
    },
    panicMode: {
      ...defaultPanicMode,
      ...(user?.reminderSettings as ReminderSettings)?.panicMode,
    }
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
      ...reminderSettings,
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
      ...reminderSettings,
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
      ...reminderSettings,
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
      ...reminderSettings,
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
      ...reminderSettings,
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

  const handleTogglePanicMode = (enabled: boolean) => {
    const updatedSettings = {
      ...reminderSettings,
      panicMode: {
        ...reminderSettings.panicMode,
        enabled,
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handlePanicTimeChange = (time: string) => {
    const updatedSettings = {
      ...reminderSettings,
      panicMode: {
        ...reminderSettings.panicMode,
        time,
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handlePanicIntervalChange = (intervalMinutes: number) => {
    const updatedSettings = {
      ...reminderSettings,
      panicMode: {
        ...reminderSettings.panicMode,
        intervalMinutes: Math.max(5, Math.min(120, intervalMinutes)),
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
        <div className="space-y-6">
          <div className="space-y-4">
            {AVAILABLE_TASKS.map((task) => {
              const reminder = reminderSettings.taskReminders[task.id];
              const isExpanded = expandedTask === task.id;

              return (
                <div key={task.id} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {reminder.enabled ? (
                        <Bell className="h-4 w-4 text-primary" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">{task.label}</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <Input
                        type="time"
                        value={reminder.time}
                        onChange={(e) => handleTimeChange(task.id, e.target.value)}
                        className="w-28 sm:w-32 h-9"
                        disabled={!reminder.enabled}
                      />
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={reminder.enabled}
                          onCheckedChange={(checked) => handleToggleReminder(task.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          className="hidden sm:inline-flex"
                        >
                          {isExpanded ? "Hide" : "More"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    className="w-full sm:hidden text-sm py-1"
                  >
                    {isExpanded ? "Hide Additional Reminders" : "Show Additional Reminders"}
                  </Button>

                  {isExpanded && (
                    <div className="pl-4 sm:pl-6 space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Additional Reminders</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addAdditionalReminder(task.id)}
                          disabled={!reminder.enabled}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>

                      {reminder.additionalReminders.map((additionalReminder, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 pl-4">
                          <Clock className="h-4 w-4 text-gray-400 hidden sm:block" />
                          <Input
                            type="time"
                            value={additionalReminder.time}
                            onChange={(e) => handleTimeChange(task.id, e.target.value, index)}
                            className="w-28 sm:w-32 h-9"
                            disabled={!reminder.enabled || !additionalReminder.enabled}
                          />
                          <div className="flex items-center space-x-2">
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4">
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`h-5 w-5 ${reminderSettings.panicMode.enabled ? 'text-red-500' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-medium">Panic Mode</h3>
                    <p className="text-sm text-gray-500">
                      Extra alerts for incomplete tasks
                    </p>
                  </div>
                </div>
                <Switch
                  checked={reminderSettings.panicMode.enabled}
                  onCheckedChange={handleTogglePanicMode}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Check Time</label>
                  <Input
                    type="time"
                    value={reminderSettings.panicMode.time}
                    onChange={(e) => handlePanicTimeChange(e.target.value)}
                    className="mt-1 h-9"
                    disabled={!reminderSettings.panicMode.enabled}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    When to check for incomplete tasks
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Reminder Interval</label>
                  <Input
                    type="number"
                    min="5"
                    max="120"
                    value={reminderSettings.panicMode.intervalMinutes}
                    onChange={(e) => handlePanicIntervalChange(parseInt(e.target.value))}
                    className="mt-1 h-9"
                    disabled={!reminderSettings.panicMode.enabled}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minutes between reminders (5-120)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}