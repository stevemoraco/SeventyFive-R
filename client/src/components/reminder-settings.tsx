import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { ReminderSettings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, BellOff } from "lucide-react";

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
  const reminderSettings = user?.reminderSettings as ReminderSettings || {
    enabled: false,
    time: "20:00",
    tasks: [],
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

  const handleToggleTask = (taskId: string) => {
    const tasks = reminderSettings.tasks.includes(taskId)
      ? reminderSettings.tasks.filter(id => id !== taskId)
      : [...reminderSettings.tasks, taskId];

    updateSettingsMutation.mutate({
      ...reminderSettings,
      tasks,
    });
  };

  const handleTimeChange = (time: string) => {
    updateSettingsMutation.mutate({
      ...reminderSettings,
      time,
    });
  };

  const handleToggleEnabled = (enabled: boolean) => {
    updateSettingsMutation.mutate({
      ...reminderSettings,
      enabled,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            {reminderSettings.enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <span>Daily Reminders</span>
          </CardTitle>
          <Switch
            checked={reminderSettings.enabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reminder Time</label>
            <Input
              type="time"
              value={reminderSettings.time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="mt-1"
              disabled={!reminderSettings.enabled}
            />
            <p className="text-sm text-gray-500 mt-1">
              Set a daily reminder time for your tasks
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tasks to Remind</label>
            {AVAILABLE_TASKS.map((task) => (
              <div key={task.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={reminderSettings.tasks.includes(task.id)}
                  onCheckedChange={() => handleToggleTask(task.id)}
                  disabled={!reminderSettings.enabled}
                />
                <span className="text-sm">{task.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}